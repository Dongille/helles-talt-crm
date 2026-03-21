import type { Order, OrderItem } from '../types';

export const DISHWASHING_PRICE = 10;

export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const itemPrice = item.unitPrice
      + (item.includesMontage ? item.montageUnitPrice : 0)
      + (item.includesDishwashing ? DISHWASHING_PRICE : 0);
    return sum + item.quantity * itemPrice;
  }, 0);
}

export function calculateOrder(order: Pick<Order, 'items' | 'discountPercent' | 'depositPaid' | 'depositAmount'>) {
  const subtotal = calculateSubtotal(order.items);
  const discountAmount = subtotal * (order.discountPercent / 100);
  const netAmount = subtotal - discountAmount;
  const vatAmount = netAmount * 0.25;
  const totalAmount = netAmount + vatAmount;
  const remainingAmount = totalAmount - (order.depositPaid ? order.depositAmount : 0);
  return { subtotal, discountAmount, netAmount, vatAmount, totalAmount, remainingAmount };
}

export function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('sv-SE').format(amount);
}
