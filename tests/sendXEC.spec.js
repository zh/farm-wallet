// @ts-check
import { test, expect } from '@playwright/test';

const TEST_MNEMONIC = 'move civil loud jelly online clinic year off pepper october wise pilot';
const VALID_ADDRESS = 'ecash:qrpc3lf95apu3tvn473pmrwfpsr9lr9qucjlk5lekg';
const INVALID_ADDRESS = 'invalid-address';

test.describe('Send XEC Form', () => {
  test.beforeEach(async ({ page }) => {
    // Start the wallet and connect
    await page.goto('http://localhost:5173/');

    // Wait for wallet library to load
    await page.waitForSelector('input[placeholder="Your 12-word mnemonic phrase"]');

    // Fill mnemonic and connect
    await page.fill('input[placeholder="Your 12-word mnemonic phrase"]', TEST_MNEMONIC);
    await page.click('button:has-text("Connect")');

    // Wait for wallet to be connected and navigate to send page
    await page.waitForSelector('text=Disconnect', { timeout: 30000 });
    await page.click('button[aria-label="Send tokens"]');

    // Wait for send page to load
    await page.waitForSelector('text=Send');
    await page.waitForSelector('input[placeholder*="Recipient"]');
  });

  test('should display send XEC form with all required elements', async ({ page }) => {
    // Verify form elements are present
    await expect(page.locator('input[placeholder*="Recipient"]')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('button:has-text("MAX")')).toBeVisible();
    await expect(page.locator('button:has-text("QR Scan")')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();

    // Verify balance display
    await expect(page.locator('text*=XEC')).toBeVisible();
  });

  test('should disable send button when form is incomplete', async ({ page }) => {
    const sendButton = page.locator('button:has-text("Send")');

    // Button should be disabled initially
    await expect(sendButton).toBeDisabled();

    // Fill only address - should still be disabled
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await expect(sendButton).toBeDisabled();

    // Fill only amount - should still be disabled
    await page.fill('input[placeholder*="Recipient"]', '');
    await page.fill('input[type="number"]', '5');
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when form is complete', async ({ page }) => {
    const sendButton = page.locator('button:has-text("Send")');

    // Fill both fields with valid data
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await page.fill('input[type="number"]', '5');

    // Button should be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should show validation error for invalid address', async ({ page }) => {
    // Fill invalid address
    await page.fill('input[placeholder*="Recipient"]', INVALID_ADDRESS);

    // Should show validation error
    await expect(page.locator('text*=invalid')).toBeVisible();
  });

  test('should show validation error for negative amount', async ({ page }) => {
    // Fill negative amount
    await page.fill('input[type="number"]', '-5');

    // Should show validation error
    await expect(page.locator('text*=invalid')).toBeVisible();
  });

  test('should populate max amount when MAX button is clicked (minus 6 XEC minimum)', async ({ page }) => {
    const amountInput = page.locator('input[type="number"]');
    const maxButton = page.locator('button:has-text("MAX")');

    // Click MAX button
    await maxButton.click();

    // Amount field should be populated with available balance minus 6 XEC
    const amount = await amountInput.inputValue();
    expect(parseFloat(amount)).toBeGreaterThanOrEqual(0);

    // Get the sendable balance (should be displayed balance minus 6 XEC)
    const sendableText = await page.locator('text*=Sendable').textContent();
    if (sendableText) {
      const sendableBalance = sendableText.match(/([0-9.]+)\s*XEC/)[1];
      expect(amount).toBe(sendableBalance);
    }
  });

  test('should show insufficient balance error for amounts exceeding balance', async ({ page }) => {
    // Fill valid address and excessive amount
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await page.fill('input[type="number"]', '999999');

    // Click send button
    await page.click('button:has-text("Send")');

    // Should show insufficient balance error
    await expect(page.locator('text*=insufficient')).toBeVisible();
  });

  test('should validate form with real amounts considering dust prevention', async ({ page }) => {
    // Get the actual sendable amount first (balance minus 6 XEC)
    await page.click('button:has-text("MAX")');
    const maxAmount = await page.locator('input[type="number"]').inputValue();
    const sendableBalance = parseFloat(maxAmount);

    // Test with amount equal to sendable balance (should work)
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await page.fill('input[type="number"]', maxAmount);

    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeEnabled();

    // Test with amount slightly over sendable balance
    await page.fill('input[type="number"]', (sendableBalance + 0.01).toString());
    await page.click('button:has-text("Send")');
    await expect(page.locator('text*=insufficient')).toBeVisible();

    // Test with valid smaller amount
    if (sendableBalance > 0) {
      await page.fill('input[type="number"]', (sendableBalance * 0.1).toFixed(2));
      await expect(sendButton).toBeEnabled();
    }
  });

  test('should handle decimal amounts correctly', async ({ page }) => {
    // Fill form with decimal amount
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await page.fill('input[type="number"]', '1.25');

    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeEnabled();

    // Test with very small decimal
    await page.fill('input[type="number"]', '0.01');
    await expect(sendButton).toBeEnabled();
  });

  test('should clear form after successful validation setup', async ({ page }) => {
    // Fill form with valid data
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await page.fill('input[type="number"]', '1');

    // Verify form is filled
    await expect(page.locator('input[placeholder*="Recipient"]')).toHaveValue(VALID_ADDRESS);
    await expect(page.locator('input[type="number"]')).toHaveValue('1');

    // Note: We don't actually click send to avoid real transactions
    // This test verifies form state before submission
  });

  test('should show balance information including dust prevention', async ({ page }) => {
    // Verify balance display shows available XEC
    const balanceDisplay = page.locator('text*=available');
    await expect(balanceDisplay).toBeVisible();

    const balanceText = await balanceDisplay.textContent();
    expect(balanceText).toMatch(/\d+\.?\d*\s*XEC/);

    // Should also show sendable balance (excluding 6 XEC minimum)
    const sendableDisplay = page.locator('text*=Sendable');
    await expect(sendableDisplay).toBeVisible();

    const sendableText = await sendableDisplay.textContent();
    expect(sendableText).toMatch(/\d+\.?\d*\s*XEC/);
  });

  test('should handle address input sanitization', async ({ page }) => {
    const addressInput = page.locator('input[placeholder*="Recipient"]');

    // Test with spaces
    await addressInput.fill('  ' + VALID_ADDRESS + '  ');

    // Should be trimmed
    const value = await addressInput.inputValue();
    expect(value).toBe(VALID_ADDRESS);
  });
  test('should prevent dust UTXO creation', async ({ page }) => {
    // Get total balance to calculate scenarios
    const totalBalanceText = await page.locator('text*=Available').textContent();
    const totalBalance = parseFloat(totalBalanceText.match(/([0-9.]+)\s*XEC/)[1]);

    // If wallet has more than 6 XEC, test dust prevention
    if (totalBalance > 6) {
      // Try to send an amount that would leave less than 6 XEC
      const dustAmount = totalBalance - 3; // Would leave only 3 XEC

      await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
      await page.fill('input[type="number"]', dustAmount.toString());

      const sendButton = page.locator('button:has-text("Send")');
      await sendButton.click();

      // Should show dust prevention error
      await expect(page.locator('text*=dust')).toBeVisible();
    }
  });

  test('should allow sending when balance is very low', async ({ page }) => {
    // This test documents behavior when total balance is less than 6 XEC
    const totalBalanceText = await page.locator('text*=Available').textContent();
    const totalBalance = parseFloat(totalBalanceText.match(/([0-9.]+)\s*XEC/)[1]);

    // If balance is very low (less than 6 XEC), MAX button should set amount to 0
    if (totalBalance < 6) {
      await page.click('button:has-text("MAX")');
      const maxAmount = await page.locator('input[type="number"]').inputValue();
      expect(parseFloat(maxAmount)).toBe(0);
    }
  });
});

test.describe('Send XEC Form Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('input[placeholder="Your 12-word mnemonic phrase"]');
    await page.fill('input[placeholder="Your 12-word mnemonic phrase"]', TEST_MNEMONIC);
    await page.click('button:has-text("Connect")');
    await page.waitForSelector('text=Disconnect', { timeout: 30000 });
    await page.click('button[aria-label="Send tokens"]');
    await page.waitForSelector('input[placeholder*="Recipient"]');
  });

  test('should handle zero amount', async ({ page }) => {
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await page.fill('input[type="number"]', '0');

    // Send button should be disabled for zero amount
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeEnabled(); // Note: HTML5 min="0" allows 0, but backend validation should catch it

    // Click to test backend validation
    await sendButton.click();
    // Should show validation error for positive amount
    await expect(page.locator('text*=positive')).toBeVisible();
  });

  test('should handle very large numbers', async ({ page }) => {
    await page.fill('input[placeholder*="Recipient"]', VALID_ADDRESS);
    await page.fill('input[type="number"]', '999999999999');

    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    // Should show insufficient balance error
    await expect(page.locator('text*=insufficient')).toBeVisible();
  });

  test('should handle special characters in address', async ({ page }) => {
    // Test with various invalid characters
    const invalidAddresses = [
      'ecash:invalid<>chars',
      'ecash:test"quotes',
      'ecash:test\'quotes',
      'ecash:test&amp;entity'
    ];

    for (const addr of invalidAddresses) {
      await page.fill('input[placeholder*="Recipient"]', addr);

      // Should show validation error or sanitize input
      const value = await page.locator('input[placeholder*="Recipient"]').inputValue();
      expect(value).not.toContain('<');
      expect(value).not.toContain('"');
      expect(value).not.toContain('&');
    }
  });
});