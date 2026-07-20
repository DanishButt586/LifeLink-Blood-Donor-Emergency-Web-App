import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Whole months between a past date string and now. */
export function monthsSince(dateString: string): number {
  const then = new Date(dateString);
  const now = new Date();
  return (
    (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
  );
}

/** "Never donated" / "This month" / "3 months ago" / "2 years ago". */
export function formatLastDonation(dateString: string | null): string {
  if (!dateString) return "Never donated";

  const months = monthsSince(dateString);
  if (months <= 0) return "This month";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** Format a date as relative time, e.g., "12 minutes ago", "3 hours ago", "Yesterday". */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown time";

  const then = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  
  if (diffMs < 0) return "Just now"; // Handle future dates or slight timezone drift
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  // Fallback to simple date format if older than a week
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

