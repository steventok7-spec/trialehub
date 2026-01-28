import { test, expect } from '@playwright/test';
import { createTestEmployee, cleanupTestUsers, clientService } from '../utils/supabaseTestUtils';

const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD!;
const TEST_EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD!;

test.describe('Employee Directory (Owner View)', () => {
    let testEmployee1: Awaited<ReturnType<typeof createTestEmployee>>;
    let testEmployee2: Awaited<ReturnType<typeof createTestEmployee>>;

    test.beforeAll(async () => {
        // Create test employees
        testEmployee1 = await createTestEmployee(
            `test-emp-dir-1-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Directory Test Employee 1', monthly_salary_idr: 6000000 }
        );

        testEmployee2 = await createTestEmployee(
            `test-emp-dir-2-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Directory Test Employee 2', monthly_salary_idr: 7000000 }
        );
    });

    test.afterAll(async () => {
        await cleanupTestUsers();
    });

    test('should display employee list for owner', async ({ page }) => {
        // Login as owner
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Navigate to employees page
        await page.click('a:has-text("Employees"), button:has-text("Employees")');
        await expect(page).toHaveURL(/\/admin\/employees/);

        // Should see test employees
        await expect(page.locator(`text=${testEmployee1.name}`)).toBeVisible({ timeout: 10000 });
        await expect(page.locator(`text=${testEmployee2.name}`)).toBeVisible();
    });

    test('should show salary column for owner', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Employees"), button:has-text("Employees")');
        await expect(page).toHaveURL(/\/admin\/employees/);

        // Should see salary header
        await expect(page.locator('th:has-text("Salary"), th:has-text("Pay")')).toBeVisible();

        // Should see salary values (formatted with commas or IDR)
        const pageContent = await page.textContent('body');
        expect(pageContent).toMatch(/6,000,000|7,000,000/);
    });

    test('should NOT include owner in employee list', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Employees"), button:has-text("Employees")');

        // Should NOT see owner email in the list
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain(OWNER_EMAIL);
    });

    test('should only show active employees', async ({ page }) => {
        // Create an inactive employee
        const inactiveEmp = await createTestEmployee(
            `test-inactive-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Inactive Employee' }
        );

        // Set to inactive
        const service = clientService();
        await service
            .from('profiles')
            .update({ status: 'inactive' })
            .eq('id', inactiveEmp.id);

        // Login and check
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Employees"), button:has-text("Employees")');

        // Should see active employees
        await expect(page.locator(`text=${testEmployee1.name}`)).toBeVisible();

        // Should NOT see inactive employee
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain('Inactive Employee');
    });
});
