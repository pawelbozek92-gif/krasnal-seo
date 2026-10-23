/**
 * Polish money formatting: "3 000 zł", "307,50 zł".
 * pl-PL skips grouping for 4-digit numbers by default, so grouping is forced.
 */
const intl = (fractionDigits: number) =>
  new Intl.NumberFormat('pl-PL', {
    useGrouping: 'always' as unknown as boolean,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

export function formatPLN(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const digits = Number.isInteger(rounded) ? 0 : 2;
  let out = intl(digits).format(Math.abs(rounded));
  // Older engines ignore useGrouping: "always"; group thousands manually.
  if (!/\s/.test(out) && Math.abs(rounded) >= 1000) {
    out = out.replace(/^(\d+)/, (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
  }
  return `${rounded < 0 ? '−' : ''}${out.replace(/\s/g, ' ')} zł`;
}

export const toGross = (net: number, vatRate: number) => Math.round(net * (1 + vatRate) * 100) / 100;
