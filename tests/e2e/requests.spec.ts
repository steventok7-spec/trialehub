import { test, expect } from '@playwright/test';
import { createTestEmployee, cleanupTestUsers, cleanupTestData, clientService } from '../utils/supabaseTestUtils';

const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD!;
const TEST_EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD!;

test.describe('Request Approval Workflow', () => {
    let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
    let requestId: string;

    test.beforeAll(async () => {
        testEmployee = await createTestEmployee(
            `test-requests-${Date.now()}@example.com`,
            TEST_EMPLOYEE_PASSWORD,
            { name: 'Requests Test Employee' }
        );
    });

    test.afterAll(async () => {
        await cleanupTestData('requests', { column: 'employee_id', value: testEmployee.id });
        await cleanupTestUsers();
    });

    test('should auto-approve sick requests', async ({ page }) => {
        // Login as employee
        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        // Navigate to requests
        await page.click('a:has-text("Request"), button:has-text("Request")');

        // Submit sick request
        await page.click('button:has-text("New Request"), button:has-text("Submit")');

        // Select sick leave type
        const typeSelect = page.locator('select[name="type"], select:has-text("Type")');
        if (await typeSelect.count() > 0) {
            await typeSelect.selectOption('sick');
        }

        await page.fill('input[name="start_date"], input[type="date"]', '2026-02-15');
        await page.fill('input[name="end_date"]', '2026-02-16');
        await page.fill('textarea[name="reason"], textarea', 'Flu symptoms');

        await page.click('button[type="submit"]:has-text("Submit")');

        // Should show success
        await expect(page.locator('text=/submitted|success/i')).toBeVisible({ timeout: 10000 });

        // Verify in database that it's auto-approved
        const service = clientService();
        const { data: requests } = await service
            .from('requests')
            .select('*')
            .eq('employee_id', testEmployee.id)
            .eq('type', 'sick')
            .order('created_at', { ascending: false })
            .limit(1);

        expect(requests).toBeDefined();
        expect(requests![0].status).toBe('approved');
    });

    test('should keep leave requests as pending', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        await page.click('a:has-text("Request"), button:has-text("Request")');
        await page.click('button:has-text("New Request"), button:has-text("Submit")');

        const typeSelect = page.locator('select[name="type"], select:has-text("Type")');
        if (await typeSelect.count() > 0) {
            await typeSelect.selectOption('leave');
        }

        await page.fill('input[name="start_date"], input[type="date"]', '2026-03-15');
        await page.fill('input[name="end_date"]', '2026-03-20');
        await page.fill('textarea[name="reason"], textarea', 'Vacation');

        await page.click('button[type="submit"]:has-text("Submit")');
        await expect(page.locator('text=/submitted|success/i')).toBeVisible({ timeout: 10000 });

        // Verify status is pending
        const service = clientService();
        const { data: requests } = await service
            .from('requests')
            .select('*')
            .eq('employee_id', testEmployee.id)
            .eq('type', 'leave')
            .order('created_at', { ascending: false })
            .limit(1);

        expect(requests![0].status).toBe('pending');
        requestId = requests![0].id;
    });

    test('should allow owner to approve leave request', async ({ page }) => {
        // Login as owner
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Navigate to requests/leave management
        await page.click('a:has-text("Request"), a:has-text("Leave")');

        // Find pending request and approve
        await page.click(`button:has-text("Approve"):near(:text("${testEmployee.name}"))`);

        // Should show success
        await expect(page.locator('text=/approved|success/i')).toBeVisible({ timeout: 10000 });

        // Verify in database
        const service = clientService();
        const { data: request } = await service
            .from('requests')
            .select('status')
            .eq('id', requestId)
            .single();

        expect(request?.status).toBe('approved');
    });

    test('should allow owner to reject claim request', async ({ page }) => {
        // Create a claim request first
        const service = clientService();
        const { data: claimRequest } = await service
            .from('requests')
            .insert({
                employee_id: testEmployee.id,
                type: 'claim',
                start_date: '2026-02-01',
                end_date: '2026-02-01',
                reason: 'Travel expense',
                status: 'pending',
            })
            .select()
            .single();

        // Login as owner
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await page.click('a:has-text("Request"), a:has-text("Claim")');

        // Reject the claim
        await page.click(`button:has-text("Reject"):near(:text("${testEmployee.name}"))`);

        await expect(page.locator('text=/rejected|declined/i')).toBeVisible({ timeout: 10000 });

        // Verify
        const { data: updated } = await service
            .from('requests')
            .select('status')
            .eq('id', claimRequest!.id)
            .single();

        expect(updated?.status).toBe('rejected');
    });

    test('should prevent employee from approving own request', async ({ page }) => {
        // This is tested via RLS in integration tests
        // UI should not show approve button for employees
        await page.goto('/');
        await page.fill('input[type="email"]', testEmployee.email);
        await page.fill('input[type="password"]', testEmployee.password);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/employee\/dashboard/);

        await page.click('a:has-text("Request"), button:has-text("Request")');

        // Should NOT see approve/reject buttons
        const approveButton = page.locator('button:has-text("Approve")');
        await expect(approveButton).not.toBeVisible();
    });
});
