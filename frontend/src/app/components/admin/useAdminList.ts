import { useMemo, useState } from 'react';

type SortDirection = 'asc' | 'desc';

export interface AdminSortOption<TSort extends string> {
  value: TSort;
  label: string;
}

interface UseAdminListOptions<TItem, TSort extends string> {
  items: TItem[];
  searchText: string;
  sortKey: TSort;
  sortDirection: SortDirection;
  pageSize?: number;
  searchPredicate: (item: TItem, term: string) => boolean;
  getSortValue: (item: TItem, sortKey: TSort) => string | number | boolean | Date | null | undefined;
}

export function useAdminList<TItem, TSort extends string>({
  items,
  searchText,
  sortKey,
  sortDirection,
  pageSize = 20,
  searchPredicate,
  getSortValue,
}: UseAdminListOptions<TItem, TSort>) {
  const pageKey = `${searchText}\u0000${sortKey}\u0000${sortDirection}\u0000${pageSize}\u0000${items.length}`;
  const [pageState, setPageState] = useState({ key: pageKey, page: 1 });

  const filteredItems = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return term ? items.filter((item) => searchPredicate(item, term)) : items;
  }, [items, searchText, searchPredicate]);

  const sortedItems = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...filteredItems].sort((a, b) => compareValues(getSortValue(a, sortKey), getSortValue(b, sortKey)) * direction);
  }, [filteredItems, getSortValue, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const requestedPage = pageState.key === pageKey ? pageState.page : 1;
  const safePage = Math.min(requestedPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedItems = sortedItems.slice(startIndex, startIndex + pageSize);

  return {
    filteredItems,
    pagedItems,
    page: safePage,
    pageSize,
    setPage: (nextPage: number) => setPageState({ key: pageKey, page: Math.min(Math.max(nextPage, 1), totalPages) }),
    totalItems: sortedItems.length,
    totalPages,
    startItem: sortedItems.length === 0 ? 0 : startIndex + 1,
    endItem: Math.min(startIndex + pageSize, sortedItems.length),
  };
}

function compareValues(a: string | number | boolean | Date | null | undefined, b: string | number | boolean | Date | null | undefined) {
  const normalizedA = normalizeValue(a);
  const normalizedB = normalizeValue(b);

  if (typeof normalizedA === 'number' && typeof normalizedB === 'number') {
    return normalizedA - normalizedB;
  }
  return String(normalizedA).localeCompare(String(normalizedB), undefined, { numeric: true, sensitivity: 'base' });
}

function normalizeValue(value: string | number | boolean | Date | null | undefined) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value ?? '';
}
