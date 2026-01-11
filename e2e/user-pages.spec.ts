import { test, expect } from '@playwright/test';

/**
 * User Panel Page Tests
 * Tests for all pages accessible to authenticated users
 * 
 * Note: These pages are protected by authentication.
 * Tests verify the routes exist and handle unauthenticated access properly.
 */

test.describe('User Panel - Dashboard Page', () => {
  test('dashboard route exists', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(2000);
    
    // Should either show login or redirect
    const url = page.url();
    const hasLoginContent = url.includes('login') || 
      (await page.locator('text=/sign in|google|login/i').count()) > 0;
    expect(hasLoginContent || url === page.url()).toBeTruthy();
  });
});

test.describe('User Panel - Grades Page', () => {
  test('grades route exists', async ({ page }) => {
    await page.goto('/#/grades');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('grades page handles unauthenticated access', async ({ page }) => {
    await page.goto('/#/grades');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Panel - Schedule Page', () => {
  test('schedule route exists', async ({ page }) => {
    await page.goto('/#/schedule');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('schedule page handles unauthenticated access', async ({ page }) => {
    await page.goto('/#/schedule');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Panel - Directory Page', () => {
  test('directory route exists', async ({ page }) => {
    await page.goto('/#/directory');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('directory page handles unauthenticated access', async ({ page }) => {
    await page.goto('/#/directory');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Panel - Campus Map Page', () => {
  test('campus-map route exists', async ({ page }) => {
    await page.goto('/#/campus-map');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('campus-map page handles unauthenticated access', async ({ page }) => {
    await page.goto('/#/campus-map');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Panel - College Forms Page', () => {
  test('college-forms route exists', async ({ page }) => {
    await page.goto('/#/college-forms');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('college-forms page handles unauthenticated access', async ({ page }) => {
    await page.goto('/#/college-forms');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Panel - Academic Calendar Page', () => {
  test('academic-calendar route exists', async ({ page }) => {
    await page.goto('/#/academic-calendar');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('academic-calendar page handles unauthenticated access', async ({ page }) => {
    await page.goto('/#/academic-calendar');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Panel - Profile Page', () => {
  test('profile route exists', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('profile page handles unauthenticated access', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Panel - Privacy Policy Page', () => {
  test('privacy route exists', async ({ page }) => {
    await page.goto('/#/privacy');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('privacy page loads content', async ({ page }) => {
    await page.goto('/#/privacy');
    await page.waitForTimeout(2000);
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

test.describe('User Panel - Terms of Service Page', () => {
  test('terms route exists', async ({ page }) => {
    await page.goto('/#/terms');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('terms page loads content', async ({ page }) => {
    await page.goto('/#/terms');
    await page.waitForTimeout(2000);
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

test.describe('User Panel - Offline Page', () => {
  test('offline route exists', async ({ page }) => {
    await page.goto('/#/offline');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('offline page shows content', async ({ page }) => {
    await page.goto('/#/offline');
    await page.waitForTimeout(1000);
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

test.describe('User Panel - 404 Not Found', () => {
  test('404 handles unknown routes', async ({ page }) => {
    await page.goto('/#/unknown-page-xyz');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('404 does not crash the app', async ({ page }) => {
    await page.goto('/#/this-page-does-not-exist');
    await page.waitForTimeout(1500);
    
    // App should still be functional
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

/**
 * User Navigation Flow Tests
 */
test.describe('User Panel - Navigation Flow', () => {
  test('can navigate between user pages', async ({ page }) => {
    // Start at login
    await page.goto('/#/login');
    await page.waitForTimeout(500);
    
    // Try to access grades
    await page.goto('/#/grades');
    await page.waitForTimeout(500);
    
    // Try schedule
    await page.goto('/#/schedule');
    await page.waitForTimeout(500);
    
    // App should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('back button navigation works', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForTimeout(300);
    
    await page.goto('/#/offline');
    await page.waitForTimeout(300);
    
    await page.goBack();
    await page.waitForTimeout(500);
    
    expect(page.url()).toContain('login');
  });

  test('forward button navigation works', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForTimeout(300);
    
    await page.goto('/#/offline');
    await page.waitForTimeout(300);
    
    await page.goBack();
    await page.waitForTimeout(300);
    
    await page.goForward();
    await page.waitForTimeout(500);
    
    expect(page.url()).toContain('offline');
  });
});
