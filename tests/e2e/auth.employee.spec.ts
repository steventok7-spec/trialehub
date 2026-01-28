import { test, expect } from '@playwright/test';
import { createTestEmployee, cleanupTestUsers } from '../utils/supabaseTestUtils';

const TEST_EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD!;
let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;

test.describe('Employee Authentication', () => {
    test.beforeAll(async () => {
        // Create test employee
        testEmployee = await createTestEmployee(
            `test-employee-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Test Employee' }
        );
    });

    test.afterAll(async () => {
        await cleanupTestUsers();
    });

    test('should login successfully and redirect to employee dashboard', async ({ page }) => {
        await page.goto('/');

        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');

        // Should redirect to employee dashboard
        await expect(page).toHaveURL(/\/employee\/dashboard/, { timeout: 10000 });

        // Should show employee name
        await expect(page.locator(`text=${testEmployee.name}`)).toBeVisible();
    });

    test('should block employee from accessing admin routes', async ({ page }) => {
        // Login as employee
        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        // Try to navigate to admin dashboard
        await page.goto('/admin/dashboard');

        // Should be redirected back to employee dashboard or login
        await expect(page).not.toHaveURL(/\/admin\/dashboard/);
        await expect(page).toHaveURL(/\/(employee\/dashboard|$)/);
    });

    test('should NOT see salary information anywhere', async ({ page }) => {
        // Login as employee
        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        // Check entire page for salary-related text
        const pageContent = await page.textContent('body');

        // Should NOT contain salary, wage, or IDR amounts
        expect(pageContent).not.toMatch(/salary/i);
        expect(pageContent).not.toMatch(/\d+,\d+\s*(IDR|Rp)/i);
        expect(pageContent).not.toMatch(/monthly.*pay/i);
    });

    test('should show error with invalid employee credentials', async ({ page }) => {
        await page.goto('/');

        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', 'wrong-password');
        await page.click('button:has-text("Sign In")');

        // Should show error
        await expect(page.locator('text=/Invalid.*credentials/i')).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveURL('/');
    });
});
