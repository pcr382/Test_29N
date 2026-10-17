/**
 * Convierte fechas con formato AAAA-MM-DD o DD-MM-AAAA a DD/MM/AAAA (ej. 06/10/2026).
 */
export function formatearFecha(fechaStr?: string | null): string {
  if (!fechaStr) return '—';
  const str = fechaStr.trim();
  // Formato AAAA-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // Formato DD-MM-AAAA o DD/MM/AAAA
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return str;
}
