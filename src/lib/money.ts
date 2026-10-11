export function formatMoney(value: number, currency = "AED", opts: { decimals?: boolean } = {}): string {
  const rounded = Math.round(value * 100) / 100;
  const decimals = opts.decimals ?? !Number.isInteger(rounded);
  const text = Math.abs(rounded).toLocaleString("en-US", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0
  });
  return `${rounded < 0 ? "-" : ""}${currency} ${text}`;
}

export const roundMoney = (n: number) => Math.round(n * 100) / 100;
export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
