const TZ = "America/New_York";

function day(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

// "Updated today at 7:19 AM ET" from the newest collected_at. Day boundaries are in Eastern time
// because that's when the daily run happens. Returns null when there is no timestamp.
export function formatUpdated(iso: string | null, now = new Date()): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const time = at.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const when =
    day(at) === day(now)
      ? "today"
      : day(at) === day(yesterday)
        ? "yesterday"
        : at.toLocaleDateString("en-US", { timeZone: TZ, month: "short", day: "numeric" });
  return `Updated ${when} at ${time} ET`;
}
