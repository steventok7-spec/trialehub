import { test, expect } from '@playwright/test';
import { createTestEmployee, cleanupTestUsers, clientService } from '../utils/supabaseTestUtils';

const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD!;
const TEST_EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD!;

test.describe('Payroll Calculation', () => {
    let fullTimeEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
    let partTimeEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
    let inactiveEmployee: Awaited<ReturnType<typeof createTestEmployee>>;

    test.beforeAll(async () => {
        fullTimeEmployee = await createTestEmployee(
            `test-payroll-ft-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            {
                name: 'Full Time Employee',
                employment_type: 'full-time',
                monthly_salary_idr: 10000000,
            }
        );

        partTimeEmployee = await createTestEmployee(
            `test-payroll-pt-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            {
                name: 'Part Time Employee',
                employment_type: 'part-time',
                hourly_rate_idr: 50000,
            }
        );

        inactiveEmployee = await createTestEmployee(
            `test-payroll-inactive-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Inactive Employee' }
        );

        // Set inactive
        const service = clientService();
        await service
            .from('profiles')
            .update({ status: 'inactive' })
            .eq('id', inactiveEmployee.id);
    });

    test.afterAll(async () => {
        await cleanupTestUsers();
    });

    test('should include only active employees in payroll', async ({ page }) => {
        // Login as owner
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Navigate to payroll
        await page.click('a:has-text("Payroll"), button:has-text("Payroll")');

        // Select current month
        const monthSelect = page.locator('select[name="month"], input[type="month"]');
        if (await monthSelect.count() > 0) {
            await monthSelect.fill('2026-02');
        }

        await page.click('button:has-text("Generate"), button:has-text("Calculate")');

        // Should see active employees
        await expect(page.locator(`text=${fullTimeEmployee.name}`)).toBeVisible({ timeout: 10000 });
        await expect(page.locator(`text=${partTimeEmployee.name}`)).toBeVisible();

        // Should NOT see inactive employee
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain(inactiveEmployee.name);
    });

    test('should use monthly salary for full-time employees', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Payroll"), button:has-text("Payroll")');

        const monthSelect = page.locator('select[name="month"], input[type="month"]');
        if (await monthSelect.count() > 0) {
            await monthSelect.fill('2026-02');
        }

        await page.click('button:has-text("Generate"), button:has-text("Calculate")');

        // Find full-time employee row
        const ftRow = page.locator(`tr:has-text("${fullTimeEmployee.name}")`);
        await expect(ftRow).toBeVisible();

        // Should show 10,000,000 IDR
        const rowText = await ftRow.textContent();
        expect(rowText).toMatch(/10,000,000|10\.000\.000/);
    });

    test('should calculate hourly pay for part-time employees', async ({ page }) => {
        // Add some attendance records for part-time employee (e.g., 80 hours)
        const service = clientService();
        await service.from('attendance').insert({
            employee_id: partTimeEmployee.id,
            date: '2026-02-01',
            clock_in: '2026-02-01 09:00:00',
            clock_out: '2026-02-01 17:00:00',
            total_minutes: 480, // 8 hours
        });

        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Payroll"), button:has-text("Payroll")');

        const monthSelect = page.locator('select[name="month"], input[type="month"]');
        if (await monthSelect.count() > 0) {
            await monthSelect.fill('2026-02');
        }

        await page.click('button:has-text("Generate"), button:has-text("Calculate")');

        // Find part-time employee row
        const ptRow = page.locator(`tr:has-text("${partTimeEmployee.name}")`);
        await expect(ptRow).toBeVisible();

        // Should calculate: 8 hours × 50,000 = 400,000
        const rowText = await ptRow.textContent();
        expect(rowText).toMatch(/400,000|400\.000/);
    });

    test('should fail if private_details missing', async () => {
        // This is a database integrity test
        const service = clientService();

        // Create employee without private_details
        const { data: authData } = await service.auth.admin.createUser({
            email: `test-no-details-${Date.now()}@example.com`,
            password: 'Pass123!',
            email_confirm: true,
        });

        // Delete private_details
        await service
            .from('private_details')
            .delete()
            .eq('id', authData!.user!.id);

        // Try to fetch payroll data
        const { data: profiles } = await service
            .from('profiles')
            .select('*, private_details(*)')
            .eq('role', 'employee')
            .eq('status', 'active');

        const empWithoutDetails = profiles?.find(p => p.id === authData!.user!.id);

        // Should either not exist or have null private_details
        if (empWithoutDetails) {
            expect(empWithoutDetails.private_details).toBeNull();
        }

        // Cleanup
        await service.auth.admin.deleteUser(authData!.user!.id);
    });
});
