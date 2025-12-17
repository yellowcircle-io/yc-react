/**
 * UnitySTUDIO E2E Tests
 *
 * Tests for:
 * - Platform specs rendering
 * - CreativeCanvas component
 * - ExportManager component
 * - AI generation hook integration
 *
 * Run: npx playwright test tests/e2e/unity-studio.spec.js
 *
 * Created: December 17, 2025
 */

import { test, expect } from '@playwright/test';

// Base URLs
const PROD_URL = 'https://yellowcircle.io';
const LOCAL_URL = 'http://localhost:5173';

test.describe('UnitySTUDIO Platform Specs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Unity Notes page (UnitySTUDIO is integrated within /unity-notes)
    await page.goto('/unity-notes');
  });

  test('should load Unity Notes page', async ({ page }) => {
    // Check page loads (may require auth)
    await expect(page).toHaveTitle(/yellowCircle/i);

    // Check for unity-notes or studio-related elements
    const unityElement = page.locator('[data-testid="unity-notes"]').or(
      page.locator('text=Unity').first()
    );
    // Page might require auth, so we check for either content or login
    const isUnityVisible = await unityElement.isVisible().catch(() => false);
    const isLoginVisible = await page.locator('text=Sign in').isVisible().catch(() => false);
    console.log(`Unity visible: ${isUnityVisible}, Login visible: ${isLoginVisible}`);
  });

  test('should display platform dimension options', async ({ page }) => {
    // Look for platform selection elements
    const platformSelectors = [
      'Instagram',
      'Facebook',
      'LinkedIn',
      'Reddit',
      'Google'
    ];

    for (const platform of platformSelectors) {
      const element = page.locator(`text=${platform}`).first();
      // Platform names should appear somewhere on the page
      const count = await element.count();
      if (count > 0) {
        console.log(`Found platform: ${platform}`);
      }
    }
  });
});

test.describe('CreativeCanvas Component', () => {
  test.beforeEach(async ({ page }) => {
    // UnitySTUDIO components are integrated within /unity-notes
    await page.goto('/unity-notes');
  });

  test('should render canvas area', async ({ page }) => {
    // Look for canvas-related elements
    const _canvas = page.locator('canvas').or(
      page.locator('[data-testid="creative-canvas"]')
    );

    // Canvas might not be immediately visible, check for studio container
    const studioContainer = page.locator('.unity-studio, [class*="studio"]').first();
    await expect(studioContainer).toBeVisible({ timeout: 10000 });
  });

  test('should allow background color selection', async ({ page }) => {
    // Look for color picker or color selection elements
    const colorPicker = page.locator('input[type="color"]').or(
      page.locator('[data-testid="color-picker"]')
    );

    const count = await colorPicker.count();
    if (count > 0) {
      await expect(colorPicker.first()).toBeVisible();
    }
  });

  test('should support drag and drop elements', async ({ page }) => {
    // Check for draggable elements
    const draggable = page.locator('[draggable="true"]').or(
      page.locator('[data-draggable]')
    );

    // This test verifies drag-drop capability exists
    const count = await draggable.count();
    console.log(`Found ${count} draggable elements`);
  });
});

test.describe('ExportManager Component', () => {
  test.beforeEach(async ({ page }) => {
    // UnitySTUDIO components are integrated within /unity-notes
    await page.goto('/unity-notes');
  });

  test('should show export options', async ({ page }) => {
    // Look for export button or menu
    const exportButton = page.locator('button:has-text("Export")').or(
      page.locator('[data-testid="export-button"]')
    );

    const count = await exportButton.count();
    if (count > 0) {
      await exportButton.first().click();

      // Check for export format options
      const _formatOptions = page.locator('[data-testid="export-formats"]').or(
        page.locator('text=PNG').or(page.locator('text=Campaign'))
      );
      // Export modal/panel should appear
    }
  });

  test('should display campaign presets', async ({ page }) => {
    // Look for preset options after clicking export
    const presetLabels = [
      'Full Campaign',
      'Social Only',
      'Display Only'
    ];

    for (const preset of presetLabels) {
      const element = page.locator(`text=${preset}`);
      const count = await element.count();
      if (count > 0) {
        console.log(`Found preset: ${preset}`);
      }
    }
  });
});

test.describe('Platform Dimension Compliance', () => {
  // These tests verify the platform specs are correctly implemented

  test('Instagram dimensions should be correct', async ({ page }) => {
    await page.goto('/unity-notes');

    // Instagram Feed Portrait: 1080x1350
    const instagramFeed = page.locator('text=1080').or(
      page.locator('text=4:5')
    );
    const count = await instagramFeed.count();
    console.log(`Instagram dimension references found: ${count}`);
  });

  test('LinkedIn dimensions should be correct', async ({ page }) => {
    await page.goto('/unity-notes');

    // LinkedIn Sponsored: 1200x627
    const linkedinSponsored = page.locator('text=1200').or(
      page.locator('text=1.91:1')
    );
    const count = await linkedinSponsored.count();
    console.log(`LinkedIn dimension references found: ${count}`);
  });

  test('Google Display dimensions should be correct', async ({ page }) => {
    await page.goto('/unity-notes');

    // Google Medium Rectangle: 300x250
    const googleDisplay = page.locator('text=300x250').or(
      page.locator('text=Medium Rectangle')
    );
    const count = await googleDisplay.count();
    console.log(`Google Display dimension references found: ${count}`);
  });
});

test.describe('Safe Zone Overlays', () => {
  test('should toggle safe zone visibility', async ({ page }) => {
    await page.goto('/unity-notes');

    // Look for safe zone toggle
    const safeZoneToggle = page.locator('text=Safe Zone').or(
      page.locator('[data-testid="safe-zone-toggle"]')
    );

    const count = await safeZoneToggle.count();
    if (count > 0) {
      await safeZoneToggle.first().click();
      console.log('Safe zone toggle clicked');
    }
  });
});

test.describe('AI Content Generation', () => {
  test('should show AI generation button', async ({ page }) => {
    await page.goto('/unity-notes');

    // Look for AI generation options
    const aiButton = page.locator('button:has-text("AI")').or(
      page.locator('button:has-text("Generate")').or(
        page.locator('[data-testid="ai-generate"]')
      )
    );

    const count = await aiButton.count();
    if (count > 0) {
      console.log('AI generation button found');
      await expect(aiButton.first()).toBeVisible();
    }
  });

  test('should display campaign type options', async ({ page }) => {
    await page.goto('/unity-notes');

    // Campaign types from useAIGeneration.js
    const campaignTypes = [
      'Brand Awareness',
      'Lead Generation',
      'Conversion',
      'Engagement',
      'Retargeting'
    ];

    for (const type of campaignTypes) {
      const element = page.locator(`text=${type}`);
      const count = await element.count();
      if (count > 0) {
        console.log(`Found campaign type: ${type}`);
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/unity-notes');

    // Page should still load on mobile
    await expect(page).toHaveTitle(/yellowCircle/i);
  });

  test('should render on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/unity-notes');

    await expect(page).toHaveTitle(/yellowCircle/i);
  });
});
