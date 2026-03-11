import { format, parseISO } from 'date-fns'

export function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), 'yyyy-MM-dd HH:mm')
}

export function formatDateOnly(isoString: string): string {
  return format(parseISO(isoString), 'yyyy-MM-dd')
}

export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'HH:mm')
}

export function toLocalDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function entryLocalDate(isoString: string): string {
  return format(parseISO(isoString), 'yyyy-MM-dd')
}
