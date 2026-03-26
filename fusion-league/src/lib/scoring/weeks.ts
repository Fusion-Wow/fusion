import { TZDate, tz } from "date-fns/tz"; // date-fns-tz
import { nextTuesday, setHours, setMinutes, setSeconds, isPast, isFuture } from "date-fns";

const EST = "America/New_York";

/**
 * Returns the most recent Tuesday at midnight EST (the reset boundary).
 */
export function getCurrentWeekReset(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 2=Tue
  const daysBack = day >= 2 ? day - 2 : day + 5;
  const reset = new Date(now);
  reset.setDate(now.getDate() - daysBack);
  reset.setHours(0, 0, 0, 0);
  return reset;
}

/**
 * Returns the picks-open window for the current week.
 * Open: Tuesday 8:00am EST
 * Close: Tuesday 8:00pm EST
 */
export function getPicksWindow(): { open: Date; close: Date } {
  const reset = getCurrentWeekReset();

  const open = new Date(reset);
  open.setHours(8, 0, 0, 0); // 8am

  const close = new Date(reset);
  close.setHours(20, 0, 0, 0); // 8pm

  return { open, close };
}

export function isPicksWindowOpen(): boolean {
  const { open, close } = getPicksWindow();
  const now = new Date();
  return now >= open && now <= close;
}

export function getPicksWindowStatus(): "before" | "open" | "closed" {
  const { open, close } = getPicksWindow();
  const now = new Date();
  if (now < open) return "before";
  if (now > close) return "closed";
  return "open";
}

/**
 * Returns a human-readable countdown string to the next picks window.
 */
export function timeUntilPicksOpen(): string {
  const { open } = getPicksWindow();
  const now = new Date();
  if (now >= open) return "Picks are open!";

  const diffMs = open.getTime() - now.getTime();
  const hours = Math.floor(diffMs / 1000 / 60 / 60);
  const minutes = Math.floor((diffMs / 1000 / 60) % 60);
  return `Opens in ${hours}h ${minutes}m`;
}
