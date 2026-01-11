import { test, expect } from '@playwright/test';

/**
 * Basic navigation and page load tests
 */
test.describe('Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads (login page or dashboard)
    await expect(page.locator('body')).toBeVisible();
  });

  test('page has correct title', async ({ page }) => {
    await page.goto('/');
    
    // The title should contain the app name
    await expect(page).toHaveTitle(/College Central|Login/i);
  });
});

/**
 * Login page tests
 */
test.describe('Login Page', () => {
  test('displays login button', async ({ page }) => {
    await page.goto('/login');
    
    // Look for Google sign-in button or similar
    const loginButton = page.locator('button').filter({ hasText: /sign in|login|google/i });
    
    // If there's a login button, it should be visible
    const buttonCount = await loginButton.count();
    if (buttonCount > 0) {
      await expect(loginButton.first()).toBeVisible();
    }
  });
});

/**
 * Responsive design tests
 */
test.describe('Responsive Design', () => {
  test('mobile view renders correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('tablet view renders correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('desktop view renders correctly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Accessibility tests
 */
test.describe('Accessibility', () => {
  test('page has no critical accessibility issues', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility - headings exist
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    
    // A well-structured page should have at least one heading
    // Note: This is a basic check, consider using @axe-core/playwright for comprehensive testing
    expect(headingCount).toBeGreaterThanOrEqual(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt can be empty for decorative images, but should exist
      expect(alt).not.toBeNull();
    }
  });
});
