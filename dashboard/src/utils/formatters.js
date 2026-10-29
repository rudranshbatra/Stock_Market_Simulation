export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat().format(value);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};
