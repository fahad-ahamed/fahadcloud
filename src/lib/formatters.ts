export function formatBytes(b: number): string {
  return b > 1073741824
    ? `${(b / 1073741824).toFixed(1)} GB`
    : b > 1048576
      ? `${(b / 1048576).toFixed(1)} MB`
      : `${(b / 1024).toFixed(1)} KB`;
}

export function statusColor(s: string): string {
  return s === 'active' || s === 'completed' || s === 'paid' || s === 'live'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : s === 'pending' || s === 'planned' || s === 'running' || s === 'verifying'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : s === 'failed' || s === 'error' || s === 'rejected'
        ? 'bg-red-100 text-red-700 border-red-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  return `${currency === 'BDT' ? '\u09F3' : '$'}${amount.toLocaleString()}`;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}
