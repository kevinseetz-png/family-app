export function formatPrice(cents: number): string {
  if (!Number.isFinite(cents) || cents === 0) return "";
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}
