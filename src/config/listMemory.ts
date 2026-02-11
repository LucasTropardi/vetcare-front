const DEFAULT_PAGES_IN_MEMORY = 8;

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function getMaxListItems(pageSize: number): number {
  const configured = parsePositiveInt(import.meta.env.VITE_MAX_LIST_ITEMS);
  if (configured != null) return Math.max(configured, pageSize);
  return pageSize * DEFAULT_PAGES_IN_MEMORY;
}
