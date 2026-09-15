import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';

export const GIORNI_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function key(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function oggi(): string {
  return key(new Date());
}

export function parse(k: string): Date {
  return parseISO(k);
}

export function inizioSettimana(d: Date = new Date()): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

export function settimana(d: Date = new Date()): Date[] {
  const s = inizioSettimana(d);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

export function labelGiorno(d: Date): string {
  return format(d, 'EEE d', { locale: it });
}

export function labelLungo(k: string): string {
  return format(parseISO(k), "EEEE d MMMM", { locale: it });
}

export function labelMese(d: Date): string {
  return format(d, 'MMMM yyyy', { locale: it });
}

export function fmtDurata(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function giorniTra(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}
