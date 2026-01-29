import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// Email configuration - update with your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// ============================================================================
// PAYROLL FUNCTIONS
// ============================================================================

/**
 * Generate monthly payroll for all employees
 * Trigger: Cloud Scheduler (monthly at end of month)
 */
export const generateMonthlyPayroll = functions.pubsub
  .schedule('0 0 1 * *') // First day of each month
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    try {
      const today = new Date();
      const month = today.getMonth(); // 0-11
      const year = today.getFullYear();

      // Get all active employees
      const employeesSnapshot = await db
        .collection('employees')
        .where('status', '==', 'active')
        .get();

      const payrollEntries: Array<{
        employeeId: string;
        month: number;
        year: number;
        baseSalary: number;
        approvedClaims: number;
        totalPay: number;
        createdAt: admin.firestore.FieldValue;
        status: string;
      }> = [];

      for (const employeeDoc of employeesSnapshot.docs) {
        const employee = employeeDoc.data();

        // Calculate attendance hours
        const monthlyHours = await calculateMonthlyHours(
          employeeDoc.id,
          month,
          year
        );

        // Get approved claims
        const approvedClaims = await calculateApprovedClaims(employeeDoc.id);

        // Calculate salary
        let baseSalary = 0;
        let totalPay = 0;

        if (employee.employment_type === 'full_time') {
          baseSalary = employee.monthly_salary_idr || 0;
          totalPay = baseSalary + approvedClaims;
        } else if (employee.employment_type === 'part_time') {
          const hourlyRate = employee.hourly_rate_idr || 0;
          baseSalary = monthlyHours * hourlyRate;
          totalPay = baseSalary + approvedClaims;
        }

        payrollEntries.push({
          employeeId: employeeDoc.id,
          month,
          year,
          baseSalary,
          approvedClaims,
          totalPay,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });
      }

      // Batch write payroll entries
      const batch = db.batch();
      for (const entry of payrollEntries) {
        const docRef = db.collection('payroll').doc();
        batch.set(docRef, entry);
      }

      await batch.commit();

      console.log(`Generated payroll for ${payrollEntries.length} employees`);
      return { success: true, count: payrollEntries.length };
    } catch (error) {
      console.error('Error generating payroll:', error);
      throw new functions.https.HttpsError('internal', 'Payroll generation failed');
    }
  });

/**
 * Auto-approve sick leave requests
 * Trigger: When request document is created with type 'sick'
 */
export const autoApproveSickLeave = functions.firestore
  .document('requests/{requestId}')
  .onCreate(async (snap, context) => {
    try {
      const request = snap.data();

      // Only process sick requests
      if (request.type !== 'sick') {
        return;
      }

      // Auto-approve with a maximum of 3 days per month
      const employeeId = request.employee_id;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Count approved sick leaves this month
      const approvedSickLeaves = await db
        .collection('requests')
        .where('employee_id', '==', employeeId)
        .where('type', '==', 'sick')
        .where('status', '==', 'approved')
        .get();

      let approvedDays = 0;
      for (const doc of approvedSickLeaves.docs) {
        const data = doc.data();
        if (data.start_date && data.end_date) {
          const start = new Date(data.start_date);
          const end = new Date(data.end_date);
          approvedDays += Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      // Auto-approve if under limit
      if (approvedDays < 3) {
        await snap.ref.update({
          status: 'approved',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          autoApproved: true
        });

        // Send notification email
        const employee = await db.collection('employees').doc(employeeId).get();
        if (employee.exists) {
          await sendEmail(
            employee.data()?.email,
            'Sick Leave Approved',
            `Your sick leave request has been automatically approved.`
          );
        }
      }

      return;
    } catch (error) {
      console.error('Error processing sick leave:', error);
    }
  });

/**
 * Send notification emails when requests are approved
 * Trigger: When request status is updated to 'approved'
 */
export const notifyRequestApproval = functions.firestore
  .document('requests/{requestId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      const oldData = change.before.data();

      // Only process status changes to 'approved'
      if (oldData.status === 'approved' || newData.status !== 'approved') {
        return;
      }

      const request = newData;
      const employee = await db
        .collection('employees')
        .doc(request.employee_id)
        .get();

      if (!employee.exists) {
        return;
      }

      const employeeEmail = employee.data()?.email;
      const requestType = request.type.charAt(0).toUpperCase() + request.type.slice(1);

      await sendEmail(
        employeeEmail,
        `${requestType} Request Approved`,
        `Your ${request.type} request has been approved by your manager.`
      );

      return;
    } catch (error) {
      console.error('Error sending approval notification:', error);
    }
  });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total hours worked in a month
 */
async function calculateMonthlyHours(
  employeeId: string,
  month: number,
  year: number
): Promise<number> {
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const snapshot = await db
      .collection('attendance')
      .where('employee_id', '==', employeeId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    let totalMinutes = 0;
    for (const doc of snapshot.docs) {
      totalMinutes += doc.data().total_minutes || 0;
    }

    return Math.round((totalMinutes / 60) * 100) / 100; // Convert to hours
  } catch (error) {
    console.error('Error calculating monthly hours:', error);
    return 0;
  }
}

/**
 * Calculate total approved claims
 */
async function calculateApprovedClaims(employeeId: string): Promise<number> {
  try {
    const snapshot = await db
      .collection('requests')
      .where('employee_id', '==', employeeId)
      .where('type', '==', 'claim')
      .where('status', '==', 'approved')
      .get();

    let total = 0;
    for (const doc of snapshot.docs) {
      total += doc.data().amount || 0;
    }

    return total;
  } catch (error) {
    console.error('Error calculating approved claims:', error);
    return 0;
  }
}

/**
 * Send email notification
 */
async function sendEmail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html: `<p>${text}</p>`
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * HTTP function to manually trigger payroll generation
 * Requires authentication
 */
export const triggerPayrollGeneration = functions.https.onCall(
  async (data, context) => {
    // Verify user is owner
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const userDoc = await db.collection('users').doc(context.auth.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'owner') {
      throw new functions.https.HttpsError('permission-denied', 'Must be owner');
    }

    const { month, year } = data;

    if (!month || !year) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Month and year are required'
      );
    }

    try {
      const employeesSnapshot = await db
        .collection('employees')
        .where('status', '==', 'active')
        .get();

      let count = 0;

      for (const employeeDoc of employeesSnapshot.docs) {
        const employee = employeeDoc.data();

        const monthlyHours = await calculateMonthlyHours(
          employeeDoc.id,
          month - 1,
          year
        );
        const approvedClaims = await calculateApprovedClaims(employeeDoc.id);

        let baseSalary = 0;
        let totalPay = 0;

        if (employee.employment_type === 'full_time') {
          baseSalary = employee.monthly_salary_idr || 0;
          totalPay = baseSalary + approvedClaims;
        } else if (employee.employment_type === 'part_time') {
          const hourlyRate = employee.hourly_rate_idr || 0;
          baseSalary = monthlyHours * hourlyRate;
          totalPay = baseSalary + approvedClaims;
        }

        await db.collection('payroll').add({
          employeeId: employeeDoc.id,
          month,
          year,
          baseSalary,
          approvedClaims,
          totalPay,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });

        count++;
      }

      return { success: true, message: `Generated payroll for ${count} employees` };
    } catch (error) {
      console.error('Error generating payroll:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Payroll generation failed'
      );
    }
  }
);
