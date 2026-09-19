/**
 * Currency and formatting utilities for AURA Fine Jewellery
 */

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}
