import { test, expect } from '@playwright/test';
import { cleanupTestUsers, clientService } from '../utils/supabaseTestUtils';

const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD!;

test.describe('Add Employee Flow', () => {
    const testEmail = `test-new-emp-${Date.now()}@example.com`;

    test.afterAll(async () => {
        await cleanupTestUsers();
    });

    test('should create employee with full flow', async ({ page }) => {
        // Login as owner
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Navigate to add employee
        await page.click('a:has-text("Employees"), button:has-text("Employees")');
        await page.click('button:has-text("Add Employee"), a:has-text("Add Employee")');

        // Fill form
        await page.fill('input[name="name"], input[placeholder*="name" i]', 'New Test Employee');
        await page.fill('input[name="email"], input[type="email"]', testEmail);
        await page.fill('input[name="password"], input[type="password"]', 'NewEmpPass123!');
        await page.fill('input[name="salary"], input[placeholder*="salary" i]', '8000000');

        // Select job title if dropdown exists
        const jobTitleSelect = page.locator('select[name="job_title"], select[name="jobTitle"]');
        if (await jobTitleSelect.count() > 0) {
            await jobTitleSelect.selectOption('barista');
        }

        // Submit
        await page.click('button[type="submit"]:has-text("Add"), button:has-text("Create")');

        // Should show success message
        await expect(page.locator('text=/Employee.*added.*success/i')).toBeVisible({ timeout: 10000 });

        // Verify in database
        const service = clientService();

        // Check auth user created
        const { data: authUsers } = await service.auth.admin.listUsers();
        const authUser = authUsers.users.find(u => u.email === testEmail);
        expect(authUser).toBeDefined();

        // Check profile created
        const { data: profile } = await service
            .from('profiles')
            .select('*')
            .eq('email', testEmail)
            .single();

        expect(profile).toBeDefined();
        expect(profile?.role).toBe('employee');
        expect(profile?.name).toBe('New Test Employee');

        // Check private_details created
        const { data: privateDetails } = await service
            .from('private_details')
            .select('*')
            .eq('id', authUser!.id)
            .single();

        expect(privateDetails).toBeDefined();
        expect(privateDetails?.monthly_salary_idr).toBe(8000000);

        // Should appear in employee list
        await page.click('a:has-text("Employees"), button:has-text("Back")');
        await expect(page.locator('text=New Test Employee')).toBeVisible();
    });

    test('should block submission with missing required fields', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Employees"), button:has-text("Employees")');
        await page.click('button:has-text("Add Employee"), a:has-text("Add Employee")');

        // Try to submit without filling fields
        await page.click('button[type="submit"]:has-text("Add"), button:has-text("Create")');

        // Should show validation error or stay on same page
        await expect(page.locator('text=/required|fill|enter/i')).toBeVisible({ timeout: 5000 });
    });

    test('should reject duplicate email', async ({ page }) => {
        const duplicateEmail = `test-duplicate-${Date.now()}@example.com`;

        // Create first employee
        const service = clientService();
        await service.auth.admin.createUser({
            email: duplicateEmail,
            password: 'Pass123!',
            email_confirm: true,
        });

        // Try to create another with same email
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Employees"), button:has-text("Employees")');
        await page.click('button:has-text("Add Employee"), a:has-text("Add Employee")');

        await page.fill('input[name="name"], input[placeholder*="name" i]', 'Duplicate Test');
        await page.fill('input[name="email"], input[type="email"]', duplicateEmail);
        await page.fill('input[name="password"], input[type="password"]', 'Pass123!');
        await page.fill('input[name="salary"], input[placeholder*="salary" i]', '5000000');

        await page.click('button[type="submit"]:has-text("Add"), button:has-text("Create")');

        // Should show error about duplicate
        await expect(page.locator('text=/already exists|duplicate|taken/i')).toBeVisible({ timeout: 10000 });
    });
});
