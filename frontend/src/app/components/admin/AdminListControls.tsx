import type { ReactNode } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import type { AdminSortOption } from "./useAdminList";

type SortDirection = "asc" | "desc";

interface AdminListToolbarProps<TSort extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sortKey: TSort;
  onSortKeyChange: (value: TSort) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (value: SortDirection) => void;
  sortOptions: AdminSortOption<TSort>[];
  children?: ReactNode;
}
interface AdminFilterSelectProps<TValue extends string | number> {
  value: TValue;
  onChange: (value: TValue) => void;
  options: Array<{ value: TValue; label: string }>;
  ariaLabel: string;
  label?: string;
  className?: string;
}

export function AdminListToolbar<TSort extends string>({
  search,
  onSearchChange,
  searchPlaceholder,
  sortKey,
  onSortKeyChange,
  sortDirection,
  onSortDirectionChange,
  sortOptions,
  children,
}: AdminListToolbarProps<TSort>) {
  return (
    <div className="admin-panel p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="md3-field h-12 w-full rounded-lg pl-12 pr-4"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {children}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] p-1.5">
            <span className="inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort
            </span>
            <AdminFilterSelect
              value={sortKey}
              onChange={onSortKeyChange}
              options={sortOptions}
              ariaLabel="Sort by"
              icon="sort"
              className="min-w-40"
            />
            <AdminFilterSelect
              value={sortDirection}
              onChange={onSortDirectionChange}
              options={[
                { value: "asc", label: "Ascending" },
                { value: "desc", label: "Descending" },
              ]}
              ariaLabel="Sort direction"
              icon="sort"
              className="min-w-36"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminFilterSelect<TValue extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  label,
  className = "",
  icon = "filter",
}: AdminFilterSelectProps<TValue> & { icon?: "filter" | "sort" }) {
  const Icon = icon === "sort" ? ArrowUpDown : Filter;
  return (
    <label className={`relative block ${className || "min-w-40"}`}>
      {label && <span className="sr-only">{label}</span>}
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--md3-on-surface-variant)]" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="md3-field h-10 w-full rounded-lg bg-white pl-9 pr-8 text-sm"
        aria-label={ariaLabel}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPageChange,
}: AdminPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-[var(--md3-outline-variant)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--md3-on-surface-variant)]">
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-24 text-center text-sm font-medium text-[var(--md3-on-surface)]">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
