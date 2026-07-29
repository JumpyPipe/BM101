import { differenceInCalendarDays, differenceInCalendarMonths, format, formatDistanceToNow } from "date-fns";

export function formatAge(dob: Date): string {
  const months = differenceInCalendarMonths(new Date(), dob);
  if (months < 1) {
    const days = differenceInCalendarDays(new Date(), dob);
    return `${days} day${days === 1 ? "" : "s"} old`;
  }
  if (months < 24) {
    return `${months} month${months === 1 ? "" : "s"} old`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return `${years}y ${remMonths}m old`;
}

export function relativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateTime(date: Date): string {
  return format(date, "MMM d, h:mm a");
}

export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function toDatetimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
