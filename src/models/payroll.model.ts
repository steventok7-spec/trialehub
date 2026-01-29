export interface PayrollAdjustment {
  type: string;
  amount: number;
  description: string;
}

export interface Payroll {
  id?: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  workingDays: number;
  workingMinutesPerDay: number;
  attendanceData: {
    totalMinutesWorked: number;
    totalDaysWorked: number;
    expectedMinutes: number;
  };
  leaveData: {
    approvedLeaveMinutes: number;
    approvedLeaveDays: number;
  };
  calculations: {
    payableMinutes: number;
    expectedMinutes: number;
    regularPayAmount: number;
  };
  adjustments: {
    bonuses: PayrollAdjustment[];
    deductions: PayrollAdjustment[];
  };
  totalAmount: number;
  status: 'generated' | 'finalized';
  createdAt?: Date;
  updatedAt?: Date;
}
