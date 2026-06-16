import type { ElementType } from 'react';
import type { UserDto } from '@/types/api';

export const CHART_COLORS = ['#2563EB', '#0F766E', '#D97706', '#7C3AED', '#DB2777', '#EA580C'];

const ROLE_LABEL: Record<number, string> = { 0: 'Admin', 1: 'Mentor', 2: 'Student' };

/** Large metric card with icon — used in Overview */
export function AdminStatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="admin-panel p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-[var(--md3-on-surface-variant)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--md3-on-surface)]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="mt-2 text-xs text-[var(--md3-on-surface-variant)]">{detail}</p>
    </div>
  );
}

/** Compact KPI card without icon — used in Reports */
export function AdminKpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="admin-panel p-5">
      <p className="text-sm text-[var(--md3-on-surface-variant)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--md3-on-surface)]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="mt-2 text-xs text-[var(--md3-on-surface-variant)]">{detail}</p>
    </div>
  );
}

/** Section title + subtitle */
export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-[var(--md3-on-surface)]">{title}</h2>
      <p className="text-sm text-[var(--md3-on-surface-variant)]">{subtitle}</p>
    </div>
  );
}

/** Label + toned badge row for status grids */
export function StatusBadgeRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'error';
}) {
  const cls =
    tone === 'success'
      ? 'bg-[var(--md3-success-container)] text-[var(--md3-success)]'
      : tone === 'warning'
        ? 'bg-[var(--md3-warning-container)] text-[var(--md3-warning)]'
        : tone === 'error'
          ? 'bg-[var(--md3-error-container)] text-[var(--md3-error)]'
          : 'bg-[var(--md3-surface-container)] text-[var(--md3-on-surface)]';
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--md3-outline-variant)] px-3 py-3">
      <span className="text-sm text-[var(--md3-on-surface-variant)]">{label}</span>
      <span className={`rounded-md px-2 py-1 text-sm font-semibold ${cls}`}>{value}</span>
    </div>
  );
}

/** User row with avatar/initials, name, role and join date */
export function UserListRow({ user }: { user: UserDto }) {
  const initials = (user.fullName || user.email).charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--md3-surface-container)] px-3 py-2.5">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--md3-primary-container)] text-xs font-semibold text-[var(--md3-primary)]">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{user.fullName || user.email}</p>
        <p className="truncate text-xs text-[var(--md3-on-surface-variant)]">{user.email}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-xs font-medium text-[var(--md3-primary)]">{ROLE_LABEL[user.role] ?? 'User'}</span>
        <span className="text-xs text-[var(--md3-on-surface-variant)]">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

/** Job trend row — skill name + region/source + score badge */
export function TrendListRow({
  trend,
}: {
  trend: { techSkill: string; region?: string; source?: string; trendScore: number };
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--md3-outline-variant)] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--md3-on-surface)]">{trend.techSkill}</p>
        <p className="text-xs text-[var(--md3-on-surface-variant)]">
          {trend.region ?? 'Global'} · {trend.source ?? 'Market data'}
        </p>
      </div>
      <span className="shrink-0 rounded-md bg-[var(--md3-primary-container)] px-2 py-1 text-sm font-semibold text-[var(--md3-primary)]">
        {trend.trendScore}
      </span>
    </div>
  );
}
