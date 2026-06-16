import { useEffect, useState } from 'react';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Clock4, Power, Save, SlidersHorizontal } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { apiClient } from '@/lib/axios';
import type {
  JobScrapingSettingDto,
  UpdateJobScrapingSettingDto,
} from '@/types/api';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(timeOfDay: string): string {
  const [h, m] = timeOfDay.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function AdminSystemConfigPage() {
  const queryClient = useQueryClient();
  const [settingsForm, setSettingsForm] = useState<UpdateJobScrapingSettingDto | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' });

  const showSuccess = (message: string) => setSnackbar({ open: true, message, variant: 'success' });
  const showError = (message: string) => setSnackbar({ open: true, message, variant: 'error' });

  const { data: settings, isLoading: settingsLoading, error: settingsError, refetch: refetchSettings } = useRestQuery({
    queryKey: ['job-scraping-settings'],
    queryFn: () => apiClient.get<JobScrapingSettingDto>('/api/job-trends/scraping-settings').then((r) => r.data),
  });

  useEffect(() => {
    if (settings && !settingsForm) {
      setSettingsForm({
        enabled: settings.enabled,
        frequency: settings.frequency,
        timeOfDay: settings.timeOfDay,
        dayOfWeek: settings.dayOfWeek,
      });
    }
  }, [settings, settingsForm]);

  const updateSettingsMutation = useMutation({
    mutationFn: (dto: UpdateJobScrapingSettingDto) => apiClient.put<JobScrapingSettingDto>('/api/job-trends/scraping-settings', dto).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['job-scraping-settings'], updated);
      setSettingsForm({ enabled: updated.enabled, frequency: updated.frequency, timeOfDay: updated.timeOfDay, dayOfWeek: updated.dayOfWeek });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      showSuccess('System configuration saved.');
    },
    onError: (e: unknown) => showError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save configuration.'),
  });

  return (
    <AppShell breadcrumb="Admin / System Config">
      <div className="app-page admin-page">
        <PageHeader
          title="System Config"
          description="Control automation inputs that keep market insight, recommendations, and reports fresh."
        />

        <section className="admin-panel overflow-hidden">
          <div className="border-b border-[var(--md3-outline-variant)] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--md3-on-surface)]">Scraping Schedule</h2>
                  <p className="truncate text-sm text-[var(--md3-on-surface-variant)]">Market Pulse refresh timing and automation state.</p>
                </div>
              </div>
              <SlidersHorizontal className="h-5 w-5 shrink-0 text-[var(--md3-primary)]" />
            </div>
          </div>

          {settingsLoading || !settingsForm ? (
            <div className="p-5">
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : settingsError ? (
            <div className="p-5">
              <EmptyState icon={SlidersHorizontal} title="Failed to load settings" description="Please try again." actionLabel="Retry" onAction={refetchSettings} />
            </div>
          ) : (
            <div className="grid gap-0 xl:grid-cols-[320px_1fr]">
              <div className="border-b border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container-low)] p-5 xl:border-b-0 xl:border-r">
                <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  settingsForm.enabled
                    ? 'bg-[var(--md3-secondary-container)] text-[var(--md3-on-secondary-container)]'
                    : 'bg-white text-[var(--md3-on-surface-variant)]'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${settingsForm.enabled ? 'bg-green-500' : 'bg-[var(--md3-outline)]'}`} />
                  {settingsForm.enabled ? 'Active' : 'Paused'}
                </div>

                <p className="text-2xl font-semibold leading-tight text-[var(--md3-on-surface)]">
                  {settingsForm.frequency === 'Weekly' ? settingsForm.dayOfWeek : 'Daily'}
                </p>
                <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">
                  {formatTime(settingsForm.timeOfDay)}
                </p>

                <div className="mt-5 space-y-3 rounded-lg border border-[var(--md3-outline-variant)] bg-white p-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--md3-on-surface-variant)]">
                    <Clock4 className="h-3.5 w-3.5 shrink-0" />
                    <span>Last run</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--md3-on-surface)]">
                    {settings?.lastRunAt ? new Date(settings.lastRunAt).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, enabled: !settingsForm.enabled })}
                    className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                      settingsForm.enabled
                        ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] text-[var(--md3-primary)]'
                        : 'border-[var(--md3-outline-variant)] bg-white text-[var(--md3-on-surface-variant)]'
                    }`}
                  >
                    <Power className="h-4 w-4" />
                    {settingsForm.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  <AdminActionButton
                    icon={Save}
                    label={updateSettingsMutation.isPending ? 'Saving...' : 'Save schedule'}
                    onClick={() => updateSettingsMutation.mutate(settingsForm)}
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">Frequency</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(['Daily', 'Weekly'] as const).map((frequency) => {
                      const active = settingsForm.frequency === frequency;
                      return (
                        <button
                          key={frequency}
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, frequency })}
                          className={`flex min-h-14 items-center justify-between rounded-lg border px-4 text-left transition-colors ${
                            active
                              ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] text-[var(--md3-primary)]'
                              : 'border-[var(--md3-outline-variant)] bg-white text-[var(--md3-on-surface)] hover:bg-[var(--md3-surface-container)]'
                          }`}
                        >
                          <span className="text-sm font-semibold">{frequency}</span>
                          {active && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">Day</p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const active = settingsForm.dayOfWeek === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={settingsForm.frequency !== 'Weekly'}
                          onClick={() => setSettingsForm({ ...settingsForm, dayOfWeek: day })}
                          className={`h-9 rounded-full border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            active && settingsForm.frequency === 'Weekly'
                              ? 'border-[var(--md3-primary)] bg-[var(--md3-primary-container)] text-[var(--md3-primary)]'
                              : 'border-[var(--md3-outline-variant)] bg-white text-[var(--md3-on-surface-variant)] hover:bg-[var(--md3-surface-container)]'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block max-w-56">
                  <span className="mb-2 block text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">Time</span>
                  <input
                    type="time"
                    value={settingsForm.timeOfDay.slice(0, 5)}
                    onChange={(event) => setSettingsForm({ ...settingsForm, timeOfDay: `${event.target.value}:00` })}
                    className="md3-field w-full px-4"
                  />
                </label>
              </div>
            </div>
          )}
        </section>

        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.variant} onClose={() => setSnackbar({ open: false, message: '', variant: 'success' })} />
      </div>
    </AppShell>
  );
}
