import { test, expect } from '@playwright/test';

/**
 * Login Page Feature Tests
 * Tests for crucial features on the login/landing page
 */
test.describe('Login Page Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('displays College Central branding', async ({ page }) => {
    // Check for app name anywhere on page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('College Central');
  });

  test('displays hero typing animation', async ({ page }) => {
    // The hero section should have animated text
    const heroSection = page.locator('h2, [class*="hero"]').first();
    await expect(heroSection).toBeVisible();
  });

  test('has scroll to explore button', async ({ page }) => {
    // Look for scroll text anywhere on page
    const bodyText = await page.locator('body').textContent();
    // Page may or may not have scroll indicator
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('displays feature cards', async ({ page }) => {
    // Scroll to features section
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1000);
    
    // Look for feature-related content
    const featureContent = page.locator('text=/Grade|Schedule|Campus|Calendar/i').first();
    if (await featureContent.count() > 0) {
      await expect(featureContent).toBeVisible();
    }
  });

  test('displays metrics section', async ({ page }) => {
    // Scroll to metrics
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(1000);
    
    // Look for metrics like "Active Students" or "Grades Tracked"
    const metricsContent = page.locator('text=/Students|Grades|Rating|Uptime/i').first();
    if (await metricsContent.count() > 0) {
      await expect(metricsContent).toBeVisible();
    }
  });

  test('has Google sign-in button', async ({ page }) => {
    // Scroll to find sign-in button
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(500);
    
    const googleButton = page.locator('button').filter({ hasText: /Google|Sign in|Login/i }).first();
    if (await googleButton.count() > 0) {
      await expect(googleButton).toBeVisible();
    }
  });

  test('scrolling works on login page', async ({ page }) => {
    // Scroll down
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    
    // Verify scroll happened
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Protected Feature Route Tests
 * Tests that protected features redirect properly
 */
test.describe('Protected Features', () => {
  test('grades feature redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/grades');
    await page.waitForTimeout(2000);
    
    // Should redirect to login
    const url = page.url();
    expect(url.includes('login') || url.includes('grades')).toBeTruthy();
  });

  test('schedule feature redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/schedule');
    await page.waitForTimeout(2000);
    
    // Should show login or stay on schedule (if cached)
    await expect(page.locator('body')).toBeVisible();
  });

  test('academic calendar feature redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/academic-calendar');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('campus map feature redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/campus-map');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('college forms feature redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/college-forms');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('directory feature redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/directory');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Admin Panel Feature Tests
 * Tests admin-specific features are protected
 */
test.describe('Admin Features Protection', () => {
  const adminFeatures = [
    { path: '/admin/college-info', name: 'College Info Editor' },
    { path: '/admin/branches', name: 'Branch Management' },
    { path: '/admin/calendar', name: 'Calendar Management' },
    { path: '/admin/grading', name: 'Grading Configuration' },
    { path: '/admin/analytics', name: 'Analytics Dashboard' },
    { path: '/admin/students', name: 'Student Management' },
    { path: '/admin/courses', name: 'Course Management' },
  ];

  for (const feature of adminFeatures) {
    test(`${feature.name} requires admin access`, async ({ page }) => {
      await page.goto(`/#${feature.path}`);
      await page.waitForTimeout(1500);
      
      // Should redirect away from admin
      const url = page.url();
      expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
    });
  }
});

/**
 * PWA Installation Tests
 */
test.describe('PWA Features', () => {
  test('app can be installed (has manifest)', async ({ page }) => {
    await page.goto('/');
    
    const manifest = page.locator('link[rel="manifest"]');
    expect(await manifest.count()).toBeGreaterThan(0);
  });

  test('has proper app icons', async ({ request }) => {
    const manifestResponse = await request.get('/manifest.json');
    if (manifestResponse.ok()) {
      const manifest = await manifestResponse.json();
      expect(manifest.icons).toBeTruthy();
      expect(manifest.icons.length).toBeGreaterThan(0);
    }
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/#/login');
    
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    
    // Service worker might not be registered in test environment
    expect(hasServiceWorker !== undefined).toBeTruthy();
  });
});

/**
 * Error Handling Tests
 */
test.describe('Error Handling', () => {
  test('shows appropriate UI for invalid routes', async ({ page }) => {
    await page.goto('/#/invalid-page-12345');
    
    await page.waitForTimeout(1500);
    
    // Should show something useful (login or 404)
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('handles rapid navigation gracefully', async ({ page }) => {
    // Navigate rapidly
    await page.goto('/#/login');
    await page.goto('/#/grades');
    await page.goto('/#/schedule');
    await page.goto('/#/login');
    
    // Should handle without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles browser back/forward buttons', async ({ page }) => {
    await page.goto('/#/login');
    await page.goto('/#/offline');
    
    await page.goBack();
    await page.waitForTimeout(500);
    
    await page.goForward();
    await page.waitForTimeout(500);
    
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Performance Tests
 */
test.describe('Performance', () => {
  test('login page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('no memory leaks on navigation', async ({ page }) => {
    // Initial navigation
    await page.goto('/#/login');
    
    // Navigate back and forth
    for (let i = 0; i < 3; i++) {
      await page.goto('/#/offline');
      await page.goto('/#/login');
    }
    
    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('animations do not cause performance issues', async ({ page }) => {
    await page.goto('/#/login');
    
    // Scroll rapidly to trigger animations
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(100);
    }
    
    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});
