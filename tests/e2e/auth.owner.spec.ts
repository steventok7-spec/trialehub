import { test, expect, Page } from '@playwright/test';
import { cleanupTestUsers } from '../utils/supabaseTestUtils';

const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD!;

test.describe('Owner Authentication', () => {
    test.afterAll(async () => {
        await cleanupTestUsers();
    });

    test('should login successfully and redirect to admin dashboard', async ({ page }) => {
        await page.goto('/');

        // Wait for connection status
        await expect(page.locator('text=Online')).toBeVisible({ timeout: 10000 });

        // Fill login form
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);

        // Submit
        await page.click('button:has-text("Sign In")');

        // Should redirect to admin dashboard
        await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });

        // Should show welcome message
        await expect(page.locator('text=/Welcome.*Owner/i')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/');

        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', 'wrong-password');

        await page.click('button:has-text("Sign In")');

        // Should show error toast
        await expect(page.locator('text=/Invalid.*credentials/i')).toBeVisible({ timeout: 5000 });

        // Should NOT redirect
        await expect(page).toHaveURL('/');
    });

    test('should maintain session after page refresh', async ({ page }) => {
        // Login first
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Refresh page
        await page.reload();

        // Should still be on dashboard
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Data should load
        await expect(page.locator('text=/Welcome|Dashboard/i')).toBeVisible({ timeout: 10000 });
    });

    test('should logout and clear session', async ({ page }) => {
        // Login first
        await page.goto('/');
        await page.fill('input[type="email"]', OWNER_EMAIL);
        await page.fill('input[type="password"]', OWNER_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/admin\/dashboard/);

        // Logout
        await page.click('button:has-text("Logout"), a:has-text("Logout")');

        // Should redirect to login
        await expect(page).toHaveURL('/', { timeout: 5000 });

        // Verify localStorage cleared
        const supabaseSession = await page.evaluate(() => {
            return localStorage.getItem('sukha_session');
        });
        expect(supabaseSession).toBeNull();

        // Verify Supabase session cleared
        const sbKeys = await page.evaluate(() => {
            return Object.keys(localStorage).filter(k => k.includes('supabase'));
        });
        expect(sbKeys.length).toBe(0);
    });

    test('should sync logout across tabs', async ({ browser }) => {
        const context = await browser.newContext();
        const page1 = await context.newPage();
        const page2 = await context.newPage();

        // Login in tab 1
        await page1.goto('/');
        await page1.fill('input[type="email"]', OWNER_EMAIL);
        await page1.fill('input[type="password"]', OWNER_PASSWORD);
        await page1.click('button:has-text("Sign In")');
        await expect(page1).toHaveURL(/\/admin\/dashboard/);

        // Open tab 2 (should auto-login from shared session)
        await page2.goto('/');
        await expect(page2).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });

        // Logout from tab 1
        await page1.click('button:has-text("Logout"), a:has-text("Logout")');
        await expect(page1).toHaveURL('/');

        // Tab 2 should auto-logout within 2 seconds
        await expect(page2).toHaveURL('/', { timeout: 3000 });

        await context.close();
    });

    test('should block employee from accessing admin routes', async ({ page, context }) => {
        // This test requires a test employee - will be created in employee tests
        // For now, just verify guard logic by trying to navigate directly

        await page.goto('/admin/dashboard');

        // Should redirect to login if not authenticated
        await expect(page).toHaveURL('/', { timeout: 5000 });
    });
});
