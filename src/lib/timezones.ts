export const TIMEZONE_OPTIONS = [
  // US
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  // Canada
  { value: "America/Toronto", label: "Eastern (Toronto)" },
  { value: "America/Vancouver", label: "Pacific (Vancouver)" },
  { value: "America/Edmonton", label: "Mountain (Edmonton)" },
  // Europe
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Paris", label: "CET (Paris)" },
  { value: "Europe/Berlin", label: "CET (Berlin)" },
  { value: "Europe/Amsterdam", label: "CET (Amsterdam)" },
  { value: "Europe/Rome", label: "CET (Rome)" },
  { value: "Europe/Madrid", label: "CET (Madrid)" },
  { value: "Europe/Stockholm", label: "CET (Stockholm)" },
  // Asia/Pacific
  { value: "Asia/Tokyo", label: "JST (Tokyo)" },
  { value: "Asia/Shanghai", label: "CST (Shanghai)" },
  { value: "Asia/Dubai", label: "GST (Dubai)" },
  { value: "Australia/Sydney", label: "AEST (Sydney)" },
  { value: "Australia/Melbourne", label: "AEST (Melbourne)" },
  { value: "Pacific/Auckland", label: "NZST (Auckland)" },
  // Americas
  { value: "America/Mexico_City", label: "Central (Mexico City)" },
  { value: "America/Sao_Paulo", label: "BRT (São Paulo)" },
  { value: "America/Bogota", label: "COT (Bogotá)" },
  { value: "America/Argentina/Buenos_Aires", label: "ART (Buenos Aires)" },
] as const;

export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

export function getTimezoneAbbr(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || timezone;
  } catch {
    return timezone;
  }
}

export function formatTimeInZone(time: string, timezone: string): string {
  try {
    // Check if it's a full timestamp (contains a date portion or "T")
    if (time.includes("T") || time.includes(" ") && time.length > 8) {
      // Full timestamp — parse as Date and format in the target timezone
      const date = new Date(time.replace(" ", "T").replace(/\+(\d{2})$/, "+$1:00"));
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      if (timezone) {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return formatter.format(date);
      }
      // No timezone — format in UTC
      const h = date.getUTCHours();
      const m = date.getUTCMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
    }
    // Simple "HH:mm" format
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) throw new Error("Invalid time");
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  } catch {
    return time;
  }
}

export function getTimezoneLabel(value: string): string {
  const found = TIMEZONE_OPTIONS.find((tz) => tz.value === value);
  return found ? found.label : value;
}
