import { test, expect } from '@playwright/test';
import { createTestEmployee, cleanupTestUsers, cleanupTestData, clientService } from '../utils/supabaseTestUtils';

const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD!;
const TEST_EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD!;

test.describe('Schedule Management', () => {
    let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;

    test.beforeAll(async () => {
        testEmployee = await createTestEmployee(
            `test-schedule-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Schedule Test Employee' }
        );
    });

    test.afterAll(async () => {
        await cleanupTestData('schedule', { column: 'employee_id', value: testEmployee.id });
        await cleanupTestUsers();
    });

    test('should allow owner to assign shift', async ({ page }) => {
        // Login as owner
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Navigate to scheduling
        await page.click('a:has-text("Schedule"), button:has-text("Schedule")');

        // Select employee
        const employeeSelect = page.locator(`select:has-text("${testEmployee.name}"), input:has-text("${testEmployee.name}")`);
        if (await employeeSelect.count() > 0) {
            await employeeSelect.click();
        }

        // Assign shift
        await page.fill('input[name="date"], input[type="date"]', '2026-02-10');

        const shiftSelect = page.locator('select[name="shift"]');
        if (await shiftSelect.count() > 0) {
            await shiftSelect.selectOption('morning');
        }

        await page.fill('input[name="start_time"], input[placeholder*="start" i]', '06:00');
        await page.fill('input[name="end_time"], input[placeholder*="end" i]', '14:00');

        await page.click('button:has-text("Save"), button:has-text("Assign")');

        // Should show success
        await expect(page.locator('text=/saved|assigned|success/i')).toBeVisible({ timeout: 10000 });

        // Verify in database
        const service = clientService();
        const { data: schedule } = await service
            .from('schedule')
            .select('*')
            .eq('employee_id', testEmployee.id)
            .eq('date', '2026-02-10')
            .single();

        expect(schedule).toBeDefined();
        expect(schedule?.shift).toBe('morning');
    });

    test('should prevent duplicate shifts via upsert', async ({ page }) => {
        const service = clientService();

        // Create initial schedule
        await service.from('schedule').insert({
            employee_id: testEmployee.id,
            date: '2026-02-11',
            shift: 'morning',
            start_time: '06:00',
            end_time: '14:00',
        });

        // Login and try to update same date
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Schedule"), button:has-text("Schedule")');

        await page.fill('input[name="date"], input[type="date"]', '2026-02-11');

        const shiftSelect = page.locator('select[name="shift"]');
        if (await shiftSelect.count() > 0) {
            await shiftSelect.selectOption('afternoon');
        }

        await page.fill('input[name="start_time"]', '14:00');
        await page.fill('input[name="end_time"]', '22:00');

        await page.click('button:has-text("Save"), button:has-text("Assign")');
        await expect(page.locator('text=/saved|updated|success/i')).toBeVisible({ timeout: 10000 });

        // Verify only ONE record exists
        const { data: schedules } = await service
            .from('schedule')
            .select('*')
            .eq('employee_id', testEmployee.id)
            .eq('date', '2026-02-11');

        expect(schedules?.length).toBe(1);
        expect(schedules![0].shift).toBe('afternoon');
    });

    test('should allow employee to view own schedule', async ({ page }) => {
        // Create schedule for employee
        const service = clientService();
        await service.from('schedule').insert({
            employee_id: testEmployee.id,
            date: '2026-02-12',
            shift: 'morning',
            start_time: '06:00',
            end_time: '14:00',
        });

        // Login as employee
        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        // Navigate to schedule
        await page.click('a:has-text("Schedule"), button:has-text("Schedule")');

        // Should see own schedule
        await expect(page.locator('text=/2026-02-12|Feb.*12/i')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/morning/i')).toBeVisible();
    });
});
