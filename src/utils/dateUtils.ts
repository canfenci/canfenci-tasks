export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('tr-TR');
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = parseLocalDate(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = parseLocalDate(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

export function getDueDateLabel(dateStr?: string): { label: string; className: string } {
  if (!dateStr) return { label: '', className: '' };
  if (isOverdue(dateStr)) return { label: 'Gecikmis', className: 'overdue' };
  if (isToday(dateStr)) return { label: 'Bugun', className: 'today' };
  return { label: formatDate(dateStr), className: '' };
}