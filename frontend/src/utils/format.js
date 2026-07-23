export function formatBRL(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPct(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return (n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
}

const FIL_COLORS = {
  PLA: 'var(--fil-pla)',
  ABS: 'var(--fil-abs)',
  PETG: 'var(--fil-petg)',
};

export function filamentColor(name) {
  return FIL_COLORS[(name || '').toUpperCase()] || 'var(--fil-default)';
}
