const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function parseDollarsToCents(input: string): number | null {
  const trimmed = input.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return cents > 0 ? cents : null;
}

export function centsToDollarInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
