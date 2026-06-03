import { useState, type ElementType, type ReactNode } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { BadgeCheck, BookOpen, CalendarDays, Check, Edit, GraduationCap, Mail, Phone, Plus, Save, ShieldOff, UserRound, X } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { GET_PROFILE_WITH_SKILLS } from '@/graphql/queries';
import type { UpdateProfileDto, AddSkillDto } from '@/types/api';

interface ProfileWithSkills {
  userId: string;
  bioDescription?: string;
  phoneNumber?: string;
  university?: string;
  major?: string;
  studiedYear?: number;
  skills: Array<{ id: string; skillName: string; note?: string }>;
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';

  const [newSkill, setNewSkill] = useState('');
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant?: 'success' | 'error' }>({ open: false, message: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({});

  const { data, loading, error } = useQuery(GET_PROFILE_WITH_SKILLS, {
    variables: { userId },
    skip: !userId,
  });

  const profile: ProfileWithSkills | null = (data as any)?.profileWithSkills ?? null;
  const skills = profile?.skills ?? [];
  const filledProfileFields = [
    profile?.bioDescription,
    profile?.phoneNumber,
    profile?.university,
    profile?.major,
    profile?.studiedYear,
  ].filter(Boolean).length;
  const profileCompletion = Math.round((filledProfileFields / 5) * 100);
  const accountInitial = (user?.email ?? 'U')[0].toUpperCase();

  const updateProfileMutation = useMutation({
    mutationFn: (dto: UpdateProfileDto) => apiClient.put(`/api/profiles/${userId}`, dto),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_PROFILE_WITH_SKILLS] });
      setIsEditingProfile(false);
      setSnackbar({ open: true, message: 'Profile updated successfully.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update profile.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: (dto: AddSkillDto) => apiClient.post('/api/skills', dto),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_PROFILE_WITH_SKILLS] });
      setNewSkill('');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add skill.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (skillId: string) => apiClient.delete(`/api/skills/${skillId}`),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_PROFILE_WITH_SKILLS] });
      setDeleteSkillId(null);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete skill.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
      setDeleteSkillId(null);
    },
  });

  const handleEditStart = () => {
    setProfileForm({
      bioDescription: profile?.bioDescription ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      university: profile?.university ?? '',
      major: profile?.major ?? '',
      studiedYear: profile?.studiedYear,
    });
    setIsEditingProfile(true);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || !profile) return;
    addSkillMutation.mutate({ profileId: profile.userId, skillName: newSkill.trim() });
  };

  if (loading) {
    return (
      <AppShell breadcrumb="Settings">
        <div className="app-page">
          <Skeleton className="h-36 rounded-xl" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
            <Skeleton className="h-[420px] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-52 rounded-xl" />
              <Skeleton className="h-52 rounded-xl" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Settings">
      <div className="app-page">
        <PageHeader
          title="Profile & Settings"
          description="Manage account details, profile data, skills, and access controls."
          actions={
            isEditingProfile ? (
              <div className="flex items-center gap-2">
                <ActionButton icon={X} label="Cancel" variant="neutral" size="md" onClick={() => setIsEditingProfile(false)} />
                <ActionButton
                  icon={Save}
                  label={updateProfileMutation.isPending ? 'Saving...' : 'Save changes'}
                  variant="primary"
                  size="md"
                  disabled={updateProfileMutation.isPending}
                  onClick={() => updateProfileMutation.mutate(profileForm)}
                />
              </div>
            ) : (
              <ActionButton icon={Edit} label="Edit profile" variant="tonal" size="md" onClick={handleEditStart} />
            )
          }
        />

        <section className="md3-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex items-center gap-5 p-6 lg:p-7">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--md3-primary-container)]">
                <span className="text-3xl font-semibold text-[var(--md3-primary)]">{accountInitial}</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-semibold text-[var(--md3-on-surface)]">{user?.email}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--md3-success-container)] px-3 py-1 text-xs font-medium text-[var(--md3-success)]">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">{user?.role ?? 'Student'} workspace account</p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] lg:border-l lg:border-t-0">
              <ProfileMetric label="Fields" value={`${filledProfileFields}/5`} />
              <ProfileMetric label="Skills" value={String(skills.length)} />
              <ProfileMetric label="Complete" value={`${profileCompletion}%`} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <section className="md3-card p-6">
            <SectionHeader
              title="Personal Information"
              description="Profile fields used across roadmaps, skill analysis, and mentor context."
              action={
                <ActionButton
                  icon={isEditingProfile ? X : Edit}
                  label={isEditingProfile ? 'Cancel' : 'Edit'}
                  variant={isEditingProfile ? 'neutral' : 'tonal'}
                  onClick={() => isEditingProfile ? setIsEditingProfile(false) : handleEditStart()}
                />
              }
            />

            {error ? (
              <p className="mt-5 text-sm text-[var(--md3-error)]">Failed to load profile data.</p>
            ) : isEditingProfile ? (
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--md3-on-surface)]">Bio</label>
                  <textarea
                    value={profileForm.bioDescription ?? ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bioDescription: e.target.value })}
                    className="md3-field min-h-32 w-full resize-none px-4 py-3"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <FieldEditor
                  label="Phone Number"
                  type="tel"
                  value={profileForm.phoneNumber ?? ''}
                  placeholder="Phone number"
                  onChange={(value) => setProfileForm({ ...profileForm, phoneNumber: value })}
                />
                <FieldEditor
                  label="University"
                  value={profileForm.university ?? ''}
                  placeholder="University name"
                  onChange={(value) => setProfileForm({ ...profileForm, university: value })}
                />
                <FieldEditor
                  label="Major"
                  value={profileForm.major ?? ''}
                  placeholder="Your major"
                  onChange={(value) => setProfileForm({ ...profileForm, major: value })}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--md3-on-surface)]">Year of Study</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={profileForm.studiedYear ?? ''}
                    onChange={(e) => setProfileForm({ ...profileForm, studiedYear: e.target.value ? Number(e.target.value) : undefined })}
                    className="md3-field w-full px-4"
                    placeholder="e.g. 3"
                  />
                </div>
                <div className="flex justify-end gap-2 lg:col-span-2">
                  <ActionButton icon={X} label="Cancel" variant="neutral" size="md" onClick={() => setIsEditingProfile(false)} />
                  <ActionButton
                    icon={Save}
                    label={updateProfileMutation.isPending ? 'Saving...' : 'Save changes'}
                    variant="primary"
                    size="md"
                    disabled={updateProfileMutation.isPending}
                    onClick={() => updateProfileMutation.mutate(profileForm)}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <DetailItem icon={UserRound} label="Bio" value={profile?.bioDescription || '—'} className="lg:col-span-2" />
                <DetailItem icon={Phone} label="Phone" value={profile?.phoneNumber || '—'} />
                <DetailItem icon={GraduationCap} label="University" value={profile?.university || '—'} />
                <DetailItem icon={BookOpen} label="Major" value={profile?.major || '—'} />
                <DetailItem icon={CalendarDays} label="Year of Study" value={profile?.studiedYear ?? '—'} />
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="md3-card p-6">
              <SectionHeader title="Skills" description="Technologies connected to your career profile." />

              <div className="mt-5 flex min-h-24 flex-wrap content-start gap-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--md3-status-in-progress-stroke)] bg-[var(--md3-primary-container)] px-3 text-sm font-medium text-[var(--md3-primary)]">
                    <span>{skill.skillName}</span>
                    <button
                      onClick={() => setDeleteSkillId(skill.id)}
                      className="rounded-full p-0.5 hover:bg-[var(--md3-primary)] hover:text-white"
                      aria-label={`Remove ${skill.skillName}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {skills.length === 0 && (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">No skills added yet.</p>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Add a skill (e.g. React, TypeScript)"
                  className="md3-field h-10 min-w-0 flex-1 px-3"
                />
                <ActionButton
                  icon={Plus}
                  label={addSkillMutation.isPending ? 'Adding...' : 'Add'}
                  variant="primary"
                  size="md"
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim() || addSkillMutation.isPending}
                  className="h-10"
                />
              </div>
            </section>

            <section className="md3-card p-6">
              <SectionHeader title="Security" description="Account identity and verification state." />
              <div className="mt-5 space-y-3">
                <AccountRow icon={Mail} title="Account Email" subtitle={user?.email ?? '—'} />
                <div className="flex items-center justify-between rounded-lg border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] p-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">Email Status</h3>
                    <p className="mt-1 text-xs text-[var(--md3-on-surface-variant)]">Primary account credential</p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded bg-[var(--md3-success-container)] px-2 py-1 text-xs font-medium text-[var(--md3-success)]">
                    <Check className="h-3 w-3" />
                    Verified
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--md3-error-container)] bg-white p-6 shadow-sm">
              <SectionHeader title="Danger Zone" description="Account-level actions with restricted access." titleClassName="text-[var(--md3-error)]" />
              <div className="mt-5 flex flex-col gap-4 rounded-lg border border-[var(--md3-error-container)] bg-[var(--md3-error-container)]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">Deactivate Account</h3>
                  <p className="mt-1 text-xs text-[var(--md3-on-surface-variant)]">Data preserved but access removed.</p>
                </div>
                <ActionButton icon={ShieldOff} label="Deactivate" variant="danger" size="md" onClick={() => setDeactivateOpen(true)} />
              </div>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteSkillId !== null}
        title="Remove Skill?"
        message="This removes the skill from your profile."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => { if (deleteSkillId) deleteSkillMutation.mutate(deleteSkillId); }}
        onCancel={() => setDeleteSkillId(null)}
      />

      <ConfirmDialog
        isOpen={deactivateOpen}
        title="Deactivate Account?"
        message="Your data will be preserved but you will lose access."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => setDeactivateOpen(false)}
        onCancel={() => setDeactivateOpen(false)}
      />

      <Snackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        variant={snackbar.variant ?? 'error'}
        onClose={() => setSnackbar({ open: false, message: '' })}
      />
    </AppShell>
  );
}

interface SectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  titleClassName?: string;
}

function SectionHeader({ title, description, action, titleClassName = '' }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className={`text-base font-semibold text-[var(--md3-on-surface)] ${titleClassName}`}>{title}</h2>
        <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">{description}</p>
      </div>
      {action}
    </div>
  );
}

interface ProfileMetricProps {
  label: string;
  value: string;
}

function ProfileMetric({ label, value }: ProfileMetricProps) {
  return (
    <div className="flex min-h-28 flex-col justify-center border-r border-[var(--md3-outline-variant)] px-5 last:border-r-0">
      <span className="text-2xl font-semibold text-[var(--md3-on-surface)]">{value}</span>
      <span className="mt-1 text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">{label}</span>
    </div>
  );
}

interface DetailItemProps {
  icon: ElementType;
  label: string;
  value: ReactNode;
  className?: string;
}

function DetailItem({ icon: Icon, label, value, className = '' }: DetailItemProps) {
  return (
    <div className={`rounded-lg border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] p-4 ${className}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-[var(--md3-on-surface-variant)]">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-sm leading-6 text-[var(--md3-on-surface)]">{value}</p>
    </div>
  );
}

interface FieldEditorProps {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}

function FieldEditor({ label, value, placeholder, type = 'text', onChange }: FieldEditorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--md3-on-surface)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="md3-field w-full px-4"
        placeholder={placeholder}
      />
    </div>
  );
}

interface AccountRowProps {
  icon: ElementType;
  title: string;
  subtitle: string;
}

function AccountRow({ icon: Icon, title, subtitle }: AccountRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">{title}</h3>
        <p className="mt-1 truncate text-xs text-[var(--md3-on-surface-variant)]">{subtitle}</p>
      </div>
    </div>
  );
}
