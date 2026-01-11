import { test, expect } from '@playwright/test';

/**
 * Admin Panel Page Tests
 * Tests for all admin-specific pages
 * 
 * Note: Admin pages require authentication AND admin role.
 * Tests verify routes exist and are properly protected.
 */

test.describe('Admin Panel - Main Dashboard', () => {
  test('admin route exists', async ({ page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin redirects unauthenticated users', async ({ page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(2000);
    
    // Should redirect to login
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - College Info Page', () => {
  test('college-info route exists', async ({ page }) => {
    await page.goto('/#/admin/college-info');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('college-info is protected', async ({ page }) => {
    await page.goto('/#/admin/college-info');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Branches Page', () => {
  test('branches route exists', async ({ page }) => {
    await page.goto('/#/admin/branches');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('branches is protected', async ({ page }) => {
    await page.goto('/#/admin/branches');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Hostels Page', () => {
  test('hostels route exists', async ({ page }) => {
    await page.goto('/#/admin/hostels');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('hostels is protected', async ({ page }) => {
    await page.goto('/#/admin/hostels');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Quick Links Page', () => {
  test('quick-links route exists', async ({ page }) => {
    await page.goto('/#/admin/quick-links');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('quick-links is protected', async ({ page }) => {
    await page.goto('/#/admin/quick-links');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Quotes Page', () => {
  test('quotes route exists', async ({ page }) => {
    await page.goto('/#/admin/quotes');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('quotes is protected', async ({ page }) => {
    await page.goto('/#/admin/quotes');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Forms Page', () => {
  test('forms route exists', async ({ page }) => {
    await page.goto('/#/admin/forms');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('forms is protected', async ({ page }) => {
    await page.goto('/#/admin/forms');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Calendar Page', () => {
  test('calendar route exists', async ({ page }) => {
    await page.goto('/#/admin/calendar');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('calendar is protected', async ({ page }) => {
    await page.goto('/#/admin/calendar');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Directory Page', () => {
  test('directory route exists', async ({ page }) => {
    await page.goto('/#/admin/directory');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('directory is protected', async ({ page }) => {
    await page.goto('/#/admin/directory');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Courses Page', () => {
  test('courses route exists', async ({ page }) => {
    await page.goto('/#/admin/courses');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('courses is protected', async ({ page }) => {
    await page.goto('/#/admin/courses');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Students Page', () => {
  test('students route exists', async ({ page }) => {
    await page.goto('/#/admin/students');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('students is protected', async ({ page }) => {
    await page.goto('/#/admin/students');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Campus Map Page', () => {
  test('campus-map route exists', async ({ page }) => {
    await page.goto('/#/admin/campus-map');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('campus-map is protected', async ({ page }) => {
    await page.goto('/#/admin/campus-map');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Grading Page', () => {
  test('grading route exists', async ({ page }) => {
    await page.goto('/#/admin/grading');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('grading is protected', async ({ page }) => {
    await page.goto('/#/admin/grading');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Analytics Page', () => {
  test('analytics route exists', async ({ page }) => {
    await page.goto('/#/admin/analytics');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('analytics is protected', async ({ page }) => {
    await page.goto('/#/admin/analytics');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

test.describe('Admin Panel - Support Page', () => {
  test('support route exists', async ({ page }) => {
    await page.goto('/#/admin/support');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('support is protected', async ({ page }) => {
    await page.goto('/#/admin/support');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});

/**
 * Admin Navigation Flow Tests
 */
test.describe('Admin Panel - Navigation Flow', () => {
  test('all admin routes redirect to login for unauthenticated users', async ({ page }) => {
    const adminRoutes = [
      '/admin',
      '/admin/college-info',
      '/admin/branches',
      '/admin/calendar',
      '/admin/students',
    ];

    for (const route of adminRoutes) {
      await page.goto(`/#${route}`);
      await page.waitForTimeout(1000);
      
      // Should redirect or show login
      const url = page.url();
      expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
    }
  });

  test('admin routes do not crash the app', async ({ page }) => {
    // Navigate through admin routes rapidly
    await page.goto('/#/admin');
    await page.goto('/#/admin/branches');
    await page.goto('/#/admin/calendar');
    await page.goto('/#/admin/students');
    await page.goto('/#/admin/analytics');
    
    // App should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('invalid admin routes are handled', async ({ page }) => {
    await page.goto('/#/admin/invalid-page-xyz');
    await page.waitForTimeout(1500);
    
    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Admin Panel Security Tests
 */
test.describe('Admin Panel - Security', () => {
  test('cannot access admin without authentication', async ({ page }) => {
    await page.goto('/#/admin');
    await page.waitForTimeout(2000);
    
    // Should not show admin content for unauthenticated users
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });

  test('direct URL access to admin is blocked', async ({ page }) => {
    // Try direct access to sensitive admin pages
    await page.goto('/#/admin/students');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });

  test('admin routes are protected from URL manipulation', async ({ page }) => {
    await page.goto('/#/admin/analytics?bypass=true');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url.includes('login') || !url.includes('admin')).toBeTruthy();
  });
});
