export const normalizeSymbol = (raw: string): string =>
  raw.trim().toUpperCase();

export const round2 = (n: number): number => {
  if (!Number.isFinite(n)) return 0;
  // Avoid common floating-point rounding surprises (e.g. 1.005 -> 1.00)
  const rounded = Math.round((n + 1e-9) * 100) / 100;
  return Number(rounded.toFixed(2));
};

export const formatNumber2 = (n: number): string =>
  round2(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatPercent2 = (n: number): string =>
  `${formatNumber2(n)}%`;

export const formatDateTime = (unixSeconds: number): string => {
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

