const LATE_HOUR = 8;

export function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function determineStatus(): "present" | "late" {
  return new Date().getHours() < LATE_HOUR ? "present" : "late";
}

export function buildDateFilter(month?: number, year?: number) {
  if (month && year) {
    return { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) };
  }
  if (year) {
    return { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) };
  }
  return undefined;
}

export function buildDateRangeFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return undefined;
  const filter: any = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return filter;
}
