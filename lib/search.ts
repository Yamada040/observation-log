import { Observation, ObservationFilters } from "./types";

function inDateRange(value: string, dateFrom?: string, dateTo?: string): boolean {
  const target = new Date(value).getTime();
  if (dateFrom && target < new Date(dateFrom).getTime()) {
    return false;
  }
  if (dateTo && target > new Date(dateTo).getTime()) {
    return false;
  }
  return true;
}

export function filterObservations(items: Observation[], filters: ObservationFilters): Observation[] {
  const q = filters.q?.trim().toLowerCase();
  const sortBy = filters.sortBy ?? "updatedAt";
  const sortOrder = filters.sortOrder ?? "desc";

  const filtered = items.filter((item) => {
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    if (filters.confidence && item.confidence !== filters.confidence) {
      return false;
    }
    if (filters.projectId && item.projectId !== filters.projectId) {
      return false;
    }
    if (filters.tag && !item.tags.includes(filters.tag)) {
      return false;
    }
    if (!inDateRange(item.updatedAt, filters.dateFrom, filters.dateTo)) {
      return false;
    }

    if (q) {
      const haystack = [item.title, item.observation, item.interpretation, item.nextAction]
        .join("\n")
        .toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => {
    const left = new Date(a[sortBy]).getTime();
    const right = new Date(b[sortBy]).getTime();
    if (sortOrder === "asc") {
      return left - right;
    }
    return right - left;
  });

  return filtered;
}
