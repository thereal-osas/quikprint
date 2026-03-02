/**
 * Currency formatting utilities for Nigerian Naira (NGN)
 */

const CURRENCY_SYMBOL = '₦';
const CURRENCY_CODE = 'NGN';

/**
 * Format a number as Nigerian Naira currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | undefined | null,
  options: {
    showSymbol?: boolean;
    showDecimals?: boolean;
  } = {}
): string {
  const { showSymbol = true, showDecimals = true } = options;

  // Handle undefined/null values
  const safeAmount = amount ?? 0;

  const formatted = safeAmount.toLocaleString('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
}

/**
 * Format a price for display (shorthand)
 * @param amount - The amount to format
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(amount: number | undefined | null): string {
  return formatCurrency(amount);
}

/**
 * Get the currency symbol
 */
export function getCurrencySymbol(): string {
  return CURRENCY_SYMBOL;
}

/**
 * Get the currency code
 */
export function getCurrencyCode(): string {
  return CURRENCY_CODE;
}

/**
 * Free shipping threshold in NGN
 * Can be configured via environment variable VITE_FREE_SHIPPING_THRESHOLD
 */
export const FREE_SHIPPING_THRESHOLD = parseInt(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD || '50000', 10);

/**
 * Standard shipping fee in NGN
 * Can be configured via environment variable VITE_SHIPPING_FEE
 */
export const SHIPPING_FEE = parseInt(import.meta.env.VITE_SHIPPING_FEE || '5000', 10);

