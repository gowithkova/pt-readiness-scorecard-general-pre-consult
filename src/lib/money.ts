export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function dollarsToCents(value: string | number): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return Math.round((Number.isFinite(num) ? num : 0) * 100);
}
