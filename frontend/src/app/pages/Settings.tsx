import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActionButton } from '../components/ActionButton';
import { SkillChip, hashLabel } from '../components/SkillChip';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import {
  BookOpen, CalendarDays, Camera, Edit,
  GraduationCap, Mail, Phone, Plus, Save, ShieldOff, UserRound, X,
} from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient, deleteWithCascadeMode } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { GET_PROFILE_WITH_SKILLS, GET_TECHNICAL_SKILLS, GET_USER_BY_ID } from '@/graphql/queries';
import type { UpdateProfileDto, UpdateUserDto, AddSkillDto, TechnicalSkillDto } from '@/types/api';

interface ProfileWithSkills {
  userId: string;
  bioDescription?: string;
  phoneNumber?: string;
  university?: string;
  major?: string;
  studiedYear?: number;
  skills: Array<{ id: string; technicalSkillId: string; skillName: string; category: string; note?: string }>;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const userId = user?.id ?? '';

  const [newSkill, setNewSkill] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const skillInputRef = useRef<HTMLDivElement>(null);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant?: 'success' | 'error' }>({ open: false, message: '' });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({});

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState<UpdateUserDto>({});
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  const { data: profileData, loading: profileLoading, error: profileError } = useQuery(GET_PROFILE_WITH_SKILLS, {
    variables: { userId },
    skip: !userId,
  });

  const { data: userData, loading: userLoading } = useQuery(GET_USER_BY_ID, {
    variables: { userId },
    skip: !userId,
  });

  const { data: technicalSkillsData } = useQuery(GET_TECHNICAL_SKILLS);

  const profile: ProfileWithSkills | null = (profileData as { profileWithSkills?: ProfileWithSkills })?.profileWithSkills ?? null;
  const userInfo = (userData as { userById?: { fullName?: string; avatarUrl?: string } })?.userById ?? null;
  const fullName: string = userInfo?.fullName ?? '';
  const avatarUrl: string = userInfo?.avatarUrl ?? '';

  const skills = profile?.skills ?? [];
  const technicalSkills: TechnicalSkillDto[] = (technicalSkillsData as { technicalSkills?: TechnicalSkillDto[] })?.technicalSkills ?? [];

  const skillsByCategory = skills.reduce<Record<string, ProfileWithSkills['skills']>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});
  const skillCategories = Object.keys(skillsByCategory).sort();

  const existingSkillIds = new Set(skills.map((s) => s.technicalSkillId));
  const skillQuery = newSkill.trim().toLowerCase();
  const skillSuggestions = skillQuery
    ? technicalSkills
        .filter((ts) => !existingSkillIds.has(ts.id) && ts.name.toLowerCase().includes(skillQuery))
        .slice(0, 8)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (skillInputRef.current && !skillInputRef.current.contains(e.target as Node)) {
        setSkillDropdownOpen(false);
      }
    }
    if (skillDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [skillDropdownOpen]);

  const initials = (() => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return (user?.email?.[0] ?? 'U').toUpperCase();
  })();

  const updateUserMutation = useMutation({
    mutationFn: (dto: UpdateUserDto) => apiClient.put(`/api/users/${userId}`, dto),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_USER_BY_ID] });
      setIsEditingAccount(false);
      setSnackbar({ open: true, message: 'Account updated successfully.', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update account.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

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
    mutationFn: (skillId: string) => deleteWithCascadeMode(`/api/skills/${skillId}`),
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

  const deactivateMutation = useMutation({
    mutationFn: () => deleteWithCascadeMode(`/api/users/${userId}`),
    onSuccess: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to deactivate account.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
      setDeactivateOpen(false);
    },
  });

  const handleEditProfileStart = () => {
    setProfileForm({
      bioDescription: profile?.bioDescription ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      university: profile?.university ?? '',
      major: profile?.major ?? '',
      studiedYear: profile?.studiedYear,
    });
    setIsEditingProfile(true);
  };

  const handleEditAccountStart = () => {
    setAccountForm({ fullName, avatarUrl });
    setAvatarPreviewError(false);
    setIsEditingAccount(true);
  };

  const handleAddSkill = (skillName?: string) => {
    const name = (skillName ?? newSkill).trim();
    if (!name) return;
    addSkillMutation.mutate({ profileId: user?.profileId ?? '', skillName: name });
    setSkillDropdownOpen(false);
  };

  const isLoading = profileLoading || userLoading;

  if (isLoading) {
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

  const previewAvatarUrl = isEditingAccount ? (accountForm.avatarUrl ?? '') : avatarUrl;
  const showAvatarImage = !!previewAvatarUrl && !avatarPreviewError;

  return (
    <AppShell breadcrumb="Settings">
      <div className="app-page">
        <PageHeader
          title="Profile & Settings"
          description="Manage account details, profile data, skills, and access controls."
        />

        {/* Account card */}
        <section className="md3-card overflow-hidden">
          <div className="grid grid-cols-1">
            <div className="flex items-center gap-5 p-6 lg:p-7">
              {/* Avatar */}
              <div className="relative shrink-0 group">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--md3-primary-container)] overflow-hidden">
                  {showAvatarImage ? (
                    <img
                      src={previewAvatarUrl}
                      alt={fullName || user?.email}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarPreviewError(true)}
                    />
                  ) : (
                    <span className="text-3xl font-semibold text-[var(--md3-primary)]">{initials}</span>
                  )}
                </div>
                {!isEditingAccount && (
                  <button
                    onClick={handleEditAccountStart}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--md3-primary)] text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Edit avatar"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {isEditingAccount ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Full Name</label>
                      <input
                        type="text"
                        value={accountForm.fullName ?? ''}
                        onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                        placeholder="Your full name"
                        className="md3-field w-full px-3 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--md3-on-surface-variant)]">Avatar URL</label>
                      <input
                        type="url"
                        value={accountForm.avatarUrl ?? ''}
                        onChange={(e) => { setAccountForm({ ...accountForm, avatarUrl: e.target.value }); setAvatarPreviewError(false); }}
                        placeholder="https://example.com/avatar.jpg"
                        className="md3-field w-full px-3 h-9 text-sm"
                      />
                      {accountForm.avatarUrl && !avatarPreviewError && (
                        <p className="mt-1 text-xs text-[var(--md3-on-surface-variant)]">Preview shown in avatar above.</p>
                      )}
                      {avatarPreviewError && (
                        <p className="mt-1 text-xs text-[var(--md3-error)]">Could not load image from this URL.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <ActionButton
                        icon={Save}
                        label={updateUserMutation.isPending ? 'Saving...' : 'Save'}
                        variant="primary"
                        size="md"
                        disabled={updateUserMutation.isPending}
                        onClick={() => updateUserMutation.mutate(accountForm)}
                      />
                      <ActionButton icon={X} label="Cancel" variant="neutral" size="md" onClick={() => setIsEditingAccount(false)} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-2xl font-semibold text-[var(--md3-on-surface)]">
                        {fullName || user?.email}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--md3-success-container)] px-3 py-1 text-xs font-medium text-[var(--md3-success)]">
                        <BadgeCheckIcon />
                        Verified
                      </span>
                    </div>
                    {fullName && (
                      <p className="mt-0.5 text-sm text-[var(--md3-on-surface-variant)]">{user?.email}</p>
                    )}
                    <p className="mt-1 text-sm text-[var(--md3-on-surface-variant)]">{user?.role ?? 'Student'} workspace account</p>
                    <button
                      onClick={handleEditAccountStart}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--md3-primary)] hover:underline"
                    >
                      <Edit className="h-3 w-3" /> Edit name & avatar
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          {/* Personal Information */}
          <section className="md3-card p-6">
            <SectionHeader
              title="Personal Information"
              description="Profile fields used across roadmaps, skill analysis, and mentor context."
              action={
                <ActionButton
                  icon={isEditingProfile ? X : Edit}
                  label={isEditingProfile ? 'Cancel' : 'Edit'}
                  variant={isEditingProfile ? 'neutral' : 'tonal'}
                  onClick={() => isEditingProfile ? setIsEditingProfile(false) : handleEditProfileStart()}
                />
              }
            />

            {profileError ? (
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
            {/* Skills */}
            <section className="md3-card p-6">
              <SectionHeader title="Skills" description="Technologies connected to your career profile." />

              <div className="mt-5 flex min-h-24 flex-col gap-3">
                {skillCategories.length === 0 && (
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">No skills added yet.</p>
                )}
                {skillCategories.map((category) => (
                  <div key={category}>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--md3-on-surface-variant)]">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skillsByCategory[category].map((skill) => (
                        <SkillChip
                          key={skill.id}
                          label={skill.skillName}
                          colorIndex={hashLabel(category)}
                          onRemove={() => setDeleteSkillId(skill.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="relative min-w-0 flex-1" ref={skillInputRef}>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => { setNewSkill(e.target.value); setSkillDropdownOpen(true); }}
                    onFocus={() => setSkillDropdownOpen(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add a skill (e.g. React, TypeScript)"
                    className="md3-field h-10 w-full px-3"
                  />
                  {skillDropdownOpen && skillSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-11 z-20 max-h-60 overflow-y-auto rounded-xl border border-[var(--md3-outline-variant)] bg-white py-1 shadow-lg">
                      {skillSuggestions.map((ts) => (
                        <button
                          key={ts.id}
                          type="button"
                          onClick={() => handleAddSkill(ts.name)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--md3-surface-variant)] transition-colors"
                        >
                          <span className="text-[var(--md3-on-surface)]">{ts.name}</span>
                          <span className="text-xs text-[var(--md3-on-surface-variant)]">{ts.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ActionButton
                  icon={Plus}
                  label={addSkillMutation.isPending ? 'Adding...' : 'Add'}
                  variant="primary"
                  size="md"
                  onClick={() => handleAddSkill()}
                  disabled={!newSkill.trim() || addSkillMutation.isPending}
                  className="h-10 shrink-0"
                />
              </div>
            </section>

            {/* Security */}
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
                    <BadgeCheckIcon />
                    Verified
                  </div>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
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
        confirmLabel={deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
        variant="danger"
        onConfirm={() => deactivateMutation.mutate()}
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

function BadgeCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
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
