import { test, expect } from '@playwright/test';
import { createTestEmployee, cleanupTestUsers, cleanupTestData } from '../utils/supabaseTestUtils';

const TEST_EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD!;

test.describe('Attendance with Geo-Validation', () => {
    let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;

    test.beforeAll(async () => {
        testEmployee = await createTestEmployee(
            `test-attendance-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Attendance Test Employee' }
        );
    });

    test.afterAll(async () => {
        await cleanupTestData('attendance', { column: 'employee_id', value: testEmployee.id });
        await cleanupTestUsers();
    });

    test('should allow clock-in with valid GPS location (mocked)', async ({ page, context }) => {
        // Mock geolocation to valid office location
        await context.setGeolocation({ latitude: -6.2088, longitude: 106.8456 }); // Jakarta coordinates
        await context.grantPermissions(['geolocation']);

        // Login as employee
        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        // Navigate to attendance/clock-in
        await page.click('a:has-text("Attendance"), button:has-text("Clock In")');

        // Click clock in button
        await page.click('button:has-text("Clock In")');

        // Should show success
        await expect(page.locator('text=/clocked in|success|recorded/i')).toBeVisible({ timeout: 10000 });
    });

    test('should block clock-in outside geo-fence (mocked)', async ({ page, context }) => {
        // Mock geolocation to far location (e.g., Singapore)
        await context.setGeolocation({ latitude: 1.3521, longitude: 103.8198 });
        await context.grantPermissions(['geolocation']);

        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        await page.click('a:has-text("Attendance"), button:has-text("Clock In")');
        await page.click('button:has-text("Clock In")');

        // Should show error about location
        await expect(page.locator('text=/location|not.*allowed|outside|area/i')).toBeVisible({ timeout: 10000 });
    });

    test('should block duplicate clock-in on same day', async ({ page, context }) => {
        await context.setGeolocation({ latitude: -6.2088, longitude: 106.8456 });
        await context.grantPermissions(['geolocation']);

        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        await page.click('a:has-text("Attendance"), button:has-text("Clock In")');

        // First clock-in
        await page.click('button:has-text("Clock In")');
        await expect(page.locator('text=/clocked in|success/i')).toBeVisible({ timeout: 10000 });

        // Try second clock-in
        await page.click('button:has-text("Clock In")');

        // Should show error about already clocked in
        await expect(page.locator('text=/already.*clocked|duplicate/i')).toBeVisible({ timeout: 5000 });
    });
});
