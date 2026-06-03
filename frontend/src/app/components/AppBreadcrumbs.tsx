import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from './breadcrumbs';

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const key = `${String(item.label)}-${index}`;

          return (
            <li key={key} className="flex min-w-0 items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]"
                  aria-hidden="true"
                />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate rounded-full px-2 py-1 text-sm font-medium text-[var(--md3-on-surface-variant)] transition-colors hover:bg-[var(--md3-surface-variant)] hover:text-[var(--md3-primary)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate rounded-full px-2 py-1 text-sm ${
                    isLast
                      ? 'font-semibold text-[var(--md3-on-surface)]'
                      : 'font-medium text-[var(--md3-on-surface-variant)]'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
