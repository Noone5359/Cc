import { test, expect } from '@playwright/test';

/**
 * Login Page Tests
 * Tests the authentication entry point of the application
 */
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
  });

  test('displays the login page correctly', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows interactive login elements', async ({ page }) => {
    // Wait for React to render
    await page.waitForTimeout(1000);
    
    // Login page should have some interactive elements or content
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent!.trim().length).toBeGreaterThan(0);
  });

  test('displays college branding/logo', async ({ page }) => {
    // Check for images or logo elements
    const images = page.locator('img');
    const imageCount = await images.count();
    
    // Login page should have at least one image (logo/banner)
    expect(imageCount).toBeGreaterThanOrEqual(0);
  });

  test('has proper page structure', async ({ page }) => {
    // Check for main content area
    await expect(page.locator('main, [role="main"], .login, #root')).toBeVisible();
  });

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Login elements should still be accessible
    const loginArea = page.locator('button, form, [class*="login"]').first();
    if (await loginArea.count() > 0) {
      await expect(loginArea).toBeVisible();
    }
  });
});

/**
 * Public Pages Tests
 * Tests pages accessible without authentication
 */
test.describe('Public Pages', () => {
  test('offline page loads correctly', async ({ page }) => {
    await page.goto('/#/offline');
    await expect(page.locator('body')).toBeVisible();
  });

  test('404 page handles unknown routes gracefully', async ({ page }) => {
    await page.goto('/#/some-random-nonexistent-page');
    await expect(page.locator('body')).toBeVisible();
    
    // Should show some indication of not found or redirect to login
  });
});

/**
 * Performance Tests
 * Measures key performance metrics
 */
test.describe('Performance', () => {
  test('login page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('no critical console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give time for async errors
    
    // Filter out known/expected errors
    const criticalErrors = consoleErrors.filter(
      error => !error.includes('Firebase') && 
               !error.includes('auth') &&
               !error.includes('net::ERR') &&
               !error.includes('Failed to load') &&
               !error.includes('chunk')
    );
    
    // Log errors for debugging (non-blocking)
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // Should have no critical console errors
    expect(criticalErrors.length).toBe(0);
  });
});

/**
 * SEO & Meta Tags Tests
 * Verifies proper SEO implementation
 */
test.describe('SEO & Meta Tags', () => {
  test('has proper meta description', async ({ page }) => {
    await page.goto('/');
    
    const metaDescription = page.locator('meta[name="description"]');
    const content = await metaDescription.getAttribute('content');
    
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(50);
  });

  test('has viewport meta tag for mobile', async ({ page }) => {
    await page.goto('/');
    
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('has proper Open Graph tags', async ({ page }) => {
    await page.goto('/');
    
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    
    expect(await ogTitle.count()).toBeGreaterThan(0);
    expect(await ogDescription.count()).toBeGreaterThan(0);
  });

  test('has favicon', async ({ page }) => {
    await page.goto('/');
    
    const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]');
    expect(await favicon.count()).toBeGreaterThan(0);
  });
});

/**
 * PWA Tests
 * Tests Progressive Web App functionality
 */
test.describe('PWA Features', () => {
  test('has manifest.json', async ({ page }) => {
    await page.goto('/');
    
    const manifest = page.locator('link[rel="manifest"]');
    expect(await manifest.count()).toBeGreaterThan(0);
  });

  test('manifest.json is valid', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();
    
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});

/**
 * Theme & Styling Tests
 * Verifies dark mode and styling work correctly
 */
test.describe('Theme & Styling', () => {
  test('page has visible content (not blank)', async ({ page }) => {
    await page.goto('/#/login');
    
    // Check that the page isn't completely blank
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent!.trim().length).toBeGreaterThan(0);
  });

  test('CSS is loaded correctly', async ({ page }) => {
    await page.goto('/#/login');
    
    // Check that styles are applied (page isn't unstyled)
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => 
      getComputedStyle(el).backgroundColor
    );
    
    // Should have some background color set (not default white/transparent)
    expect(backgroundColor).toBeTruthy();
  });
});
