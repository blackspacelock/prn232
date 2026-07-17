import { useState } from 'react';
import { useMutation, useQuery as useRestQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Check, CheckCircle2, Clock4, Loader2, Play, Save, SlidersHorizontal, X } from 'lucide-react';
import { AppShell, PageHeader } from '../../components/AppShell';
import { AdminActionButton } from '../../components/AdminActionButton';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Snackbar } from '../../components/Snackbar';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { apiClient } from '@/lib/axios';
import type {
  JobTrendScrapeResultDto,
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

function getErrorMessage(error: unknown, fallback: string): string {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export function AdminSystemConfigPage() {
  const queryClient = useQueryClient();
  const [settingsForm, setSettingsForm] = useState<UpdateJobScrapingSettingDto | null>(null);
  const [scrapeResult, setScrapeResult] = useState<JobTrendScrapeResultDto | null>(null);
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' });

  const showSuccess = (message: string) => setSnackbar({ open: true, message, variant: 'success' });
  const showError = (message: string) => setSnackbar({ open: true, message, variant: 'error' });

  const { data: settings, isLoading: settingsLoading, error: settingsError, refetch: refetchSettings } = useRestQuery({
    queryKey: ['job-scraping-settings'],
    queryFn: () => apiClient.get<JobScrapingSettingDto>('/api/job-trends/scraping-settings').then((r) => r.data),
  });

  const activeSettingsForm = settingsForm ??
    (settings
      ? {
          enabled: settings.enabled,
          frequency: settings.frequency,
          timeOfDay: settings.timeOfDay,
          dayOfWeek: settings.dayOfWeek,
        }
      : null);

  const updateSettingsMutation = useMutation({
    mutationFn: (dto: UpdateJobScrapingSettingDto) => apiClient.put<JobScrapingSettingDto>('/api/job-trends/scraping-settings', dto).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['job-scraping-settings'], updated);
      setSettingsForm({ enabled: updated.enabled, frequency: updated.frequency, timeOfDay: updated.timeOfDay, dayOfWeek: updated.dayOfWeek });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      showSuccess('System configuration saved.');
    },
    onError: (e: unknown) => showError(getErrorMessage(e, 'Failed to save configuration.')),
  });

  const scrapeNowMutation = useMutation({
    mutationFn: () => apiClient.post<JobTrendScrapeResultDto>('/api/job-trends/scrape').then((r) => r.data),
    onMutate: () => {
      setScrapeDialogOpen(true);
      setScrapeResult(null);
      setScrapeError('');
    },
    onSuccess: (result) => {
      setScrapeResult(result);
      queryClient.invalidateQueries({ queryKey: ['job-scraping-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['job-trends'] });
      showSuccess(`Scrape completed: ${result.totalPostingsScraped} postings processed.`);
    },
    onError: (e: unknown) => {
      setScrapeError(getErrorMessage(e, 'Failed to run scraping.'));
    },
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

          {settingsLoading || !activeSettingsForm ? (
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
                    activeSettingsForm.enabled
                    ? 'bg-[var(--md3-secondary-container)] text-[var(--md3-on-secondary-container)]'
                    : 'bg-white text-[var(--md3-on-surface-variant)]'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${activeSettingsForm.enabled ? 'bg-green-500' : 'bg-[var(--md3-outline)]'}`} />
                  {activeSettingsForm.enabled ? 'Active' : 'Paused'}
                </div>

                <p className="text-2xl font-semibold leading-tight text-[var(--md3-on-surface)]">
                  {activeSettingsForm.frequency === 'Weekly' ? activeSettingsForm.dayOfWeek : 'Daily'}
                </p>
                <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">
                  {formatTime(activeSettingsForm.timeOfDay)}
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

                {scrapeResult && (
                  <div className="mt-3 space-y-2 rounded-lg border border-[var(--md3-outline-variant)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">Latest manual scrape</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-base font-semibold text-[var(--md3-on-surface)]">{scrapeResult.totalPostingsScraped}</p>
                        <p className="text-[11px] text-[var(--md3-on-surface-variant)]">Posts</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[var(--md3-on-surface)]">{scrapeResult.trendsCreated}</p>
                        <p className="text-[11px] text-[var(--md3-on-surface-variant)]">New</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[var(--md3-on-surface)]">{scrapeResult.trendsUpdated}</p>
                        <p className="text-[11px] text-[var(--md3-on-surface-variant)]">Updated</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <ToggleSwitch
                    checked={activeSettingsForm.enabled}
                    label={activeSettingsForm.enabled ? 'Enabled' : 'Disabled'}
                    activeTone="success"
                    onChange={() => setSettingsForm({ ...activeSettingsForm, enabled: !activeSettingsForm.enabled })}
                  />

                  <div className="flex flex-wrap gap-2">
                    <AdminActionButton
                      icon={Play}
                      label={scrapeNowMutation.isPending ? 'Scraping...' : 'Scrape now'}
                      onClick={() => scrapeNowMutation.mutate()}
                      disabled={scrapeNowMutation.isPending || updateSettingsMutation.isPending}
                      variant="neutral"
                    />
                    <AdminActionButton
                      icon={Save}
                      label={updateSettingsMutation.isPending ? 'Saving...' : 'Save schedule'}
                      onClick={() => updateSettingsMutation.mutate(activeSettingsForm)}
                      disabled={updateSettingsMutation.isPending || scrapeNowMutation.isPending}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[var(--md3-on-surface-variant)]">Frequency</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(['Daily', 'Weekly'] as const).map((frequency) => {
                      const active = activeSettingsForm.frequency === frequency;
                      return (
                        <button
                          key={frequency}
                          type="button"
                          onClick={() => setSettingsForm({ ...activeSettingsForm, frequency })}
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
                      const active = activeSettingsForm.dayOfWeek === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={activeSettingsForm.frequency !== 'Weekly'}
                          onClick={() => setSettingsForm({ ...activeSettingsForm, dayOfWeek: day })}
                          className={`h-9 rounded-full border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            active && activeSettingsForm.frequency === 'Weekly'
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
                    value={activeSettingsForm.timeOfDay.slice(0, 5)}
                    onChange={(event) => setSettingsForm({ ...activeSettingsForm, timeOfDay: `${event.target.value}:00` })}
                    className="md3-field w-full px-4"
                  />
                </label>
              </div>
            </div>
          )}
        </section>

        <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.variant} onClose={() => setSnackbar({ open: false, message: '', variant: 'success' })} />
        <ScrapeStatusDialog
          isOpen={scrapeDialogOpen}
          isLoading={scrapeNowMutation.isPending}
          result={scrapeResult}
          error={scrapeError}
          onClose={() => setScrapeDialogOpen(false)}
        />
      </div>
    </AppShell>
  );
}

function ScrapeStatusDialog({
  isOpen,
  isLoading,
  result,
  error,
  onClose,
}: {
  isOpen: boolean;
  isLoading: boolean;
  result: JobTrendScrapeResultDto | null;
  error: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const isSuccess = Boolean(result) && !isLoading;
  const isError = Boolean(error) && !isLoading;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-[460px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              isError
                ? 'bg-[var(--md3-error-container)] text-[var(--md3-error)]'
                : 'bg-[var(--md3-primary-container)] text-[var(--md3-primary)]'
            }`}>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {isSuccess && <CheckCircle2 className="h-5 w-5" />}
              {isError && <AlertTriangle className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--md3-on-surface)]">
                {isLoading ? 'Scraping job trends' : isError ? 'Scraping failed' : 'Scraping completed'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--md3-on-surface-variant)]">
                {isLoading && 'Collecting the latest job postings and updating Market Pulse records.'}
                {isSuccess && 'Market Pulse data has been refreshed successfully.'}
                {isError && error}
              </p>
            </div>
          </div>
          {!isLoading && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)]"
              aria-label="Close scraping status"
            >
              <X className="h-5 w-5 text-[var(--md3-on-surface-variant)]" />
            </button>
          )}
        </div>

        {result && (
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container-low)] p-3 text-center">
            <div>
              <p className="text-xl font-semibold text-[var(--md3-on-surface)]">{result.totalPostingsScraped}</p>
              <p className="text-xs text-[var(--md3-on-surface-variant)]">Posts</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--md3-on-surface)]">{result.trendsCreated}</p>
              <p className="text-xs text-[var(--md3-on-surface-variant)]">New</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--md3-on-surface)]">{result.trendsUpdated}</p>
              <p className="text-xs text-[var(--md3-on-surface-variant)]">Updated</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="mt-5 flex justify-end">
            <AdminActionButton icon={Check} label="Done" onClick={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
