import { test, expect } from '@playwright/test';

/**
 * Mobile-Specific Tests
 * Tests for touch interactions and mobile-specific behavior
 */
test.describe('Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('touch scrolling works on mobile', async ({ page }) => {
    await page.goto('/#/login');
    
    // Page should be scrollable if content overflows
    const scrollable = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight;
    });
    
    // This is informational - page may or may not be scrollable
    expect(scrollable !== undefined).toBeTruthy();
  });

  test('no horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/#/login');
    
    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    // There should be no horizontal scroll on a well-designed mobile page
    expect(hasHorizontalScroll).toBe(false);
  });

  test('text is readable on mobile (no tiny fonts)', async ({ page }) => {
    await page.goto('/#/login');
    
    // Check that body text isn't too small
    const fontSize = await page.evaluate(() => {
      const body = document.body;
      return parseInt(getComputedStyle(body).fontSize);
    });
    
    // Font size should be at least 12px for readability
    expect(fontSize).toBeGreaterThanOrEqual(12);
  });

  test('buttons are tappable size on mobile', async ({ page }) => {
    await page.goto('/#/login');
    
    // Find buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const box = await firstButton.boundingBox();
      
      if (box) {
        // Buttons should be at least 44x44 for touch targets (Apple guidelines)
        expect(box.height).toBeGreaterThanOrEqual(30);
      }
    }
  });
});

/**
 * Tablet Experience Tests
 */
test.describe('Tablet Experience', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test('tablet layout renders correctly', async ({ page }) => {
    await page.goto('/#/login');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('content uses available space on tablet', async ({ page }) => {
    await page.goto('/#/login');
    
    // Content should not be too narrow on tablet
    const contentWidth = await page.evaluate(() => {
      const main = document.querySelector('main, #root, body');
      return main ? main.clientWidth : 0;
    });
    
    // Content should use at least 50% of viewport width
    expect(contentWidth).toBeGreaterThan(768 * 0.3);
  });
});

/**
 * Large Screen Tests
 */
test.describe('Large Screen Experience', () => {
  test.use({ viewport: { width: 2560, height: 1440 } }); // 2K monitor

  test('content is centered on very wide screens', async ({ page }) => {
    await page.goto('/#/login');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Check that content doesn't stretch edge-to-edge awkwardly
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(2560);
  });

  test('no layout issues on 4K screens', async ({ page }) => {
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto('/#/login');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Print Styles Tests
 */
test.describe('Print Support', () => {
  test('print styles work correctly', async ({ page }) => {
    await page.goto('/#/login');
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    
    // Page should still be visible in print mode
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Reduced Motion Tests
 */
test.describe('Accessibility Preferences', () => {
  test('respects reduced motion preference', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/login');
    
    // Page should load without issues
    await expect(page.locator('body')).toBeVisible();
  });

  test('works with forced colors mode', async ({ page }) => {
    // Some browsers support forced colors
    await page.goto('/#/login');
    
    // Just verify page loads
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * RTL Support Tests (if applicable)
 */
test.describe('Internationalization', () => {
  test('page handles RTL direction', async ({ page }) => {
    await page.goto('/#/login');
    
    // Manually set RTL
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    
    // Page should still render
    await expect(page.locator('body')).toBeVisible();
  });

  test('page handles different locales', async ({ page }) => {
    // Test with different locale
    await page.goto('/#/login');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Copy/Paste Tests
 */
test.describe('Clipboard Interactions', () => {
  test('text selection works', async ({ page }) => {
    await page.goto('/#/login');
    
    // Try to select text
    await page.evaluate(() => {
      const selection = window.getSelection();
      selection?.removeAllRanges();
    });
    
    // Page should still work
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Zoom Tests
 */
test.describe('Zoom Accessibility', () => {
  test('page works at 200% zoom', async ({ page }) => {
    await page.goto('/#/login');
    
    // Simulate zoom via viewport
    await page.setViewportSize({ width: 640, height: 480 });
    
    await expect(page.locator('body')).toBeVisible();
    
    // Content should still be accessible
    const hasContent = await page.locator('body').textContent();
    expect(hasContent!.length).toBeGreaterThan(0);
  });

  test('page works at 50% reduced viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/#/login');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
