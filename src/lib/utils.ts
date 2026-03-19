import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeFormat(dateStr: string | null | undefined, fmt: string, fallback = "—"): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

export function safeTimeAgo(dateStr: string | null | undefined, fallback = "—"): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return fallback;
  return formatDistanceToNow(d, { addSuffix: true });
}
