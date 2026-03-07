interface YearMonthParts {
  year: number;
  month: number;
}

function parseYearMonth(value: string): YearMonthParts | null {
  const match = value.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function formatYearMonth(parts: YearMonthParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}`;
}

function shiftYearMonth(parts: YearMonthParts, offset: number): YearMonthParts {
  const absoluteMonth = parts.year * 12 + (parts.month - 1) + offset;
  const year = Math.floor(absoluteMonth / 12);
  const month = (((absoluteMonth % 12) + 12) % 12) + 1;

  return { year, month };
}

export function getCurrentMonthValue(now: Date = new Date()): string {
  return formatYearMonth({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
}

export function getCurrentMonthStart(now: Date = new Date()): string {
  return `${getCurrentMonthValue(now)}-01`;
}

export function addMonthsToMonthValue(value: string, offset: number): string | null {
  const parsed = parseYearMonth(value);
  if (!parsed) return null;

  return formatYearMonth(shiftYearMonth(parsed, offset));
}

export function addMonthsToMonthStart(value: string, offset: number): string | null {
  const shifted = addMonthsToMonthValue(value, offset);
  if (!shifted) return null;

  return `${shifted}-01`;
}

export function buildMonthStartRange(startMonth: string, count: number): string[] {
  if (!Number.isInteger(count) || count <= 0) return [];

  return Array.from({ length: count }, (_, index) =>
    addMonthsToMonthStart(startMonth, index),
  ).filter((month): month is string => month !== null);
}

export function buildInclusiveMonthStartRange(startMonth: string, endMonth: string): string[] {
  const start = parseYearMonth(startMonth);
  const end = parseYearMonth(endMonth);

  if (!start || !end) return [];

  const startAbsolute = start.year * 12 + (start.month - 1);
  const endAbsolute = end.year * 12 + (end.month - 1);

  if (endAbsolute < startAbsolute) return [];

  return buildMonthStartRange(startMonth, endAbsolute - startAbsolute + 1);
}
