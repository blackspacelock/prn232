import { useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { Edit, Check, X, Plus, Save, ShieldOff } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { apolloClient } from '@/lib/apollo';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { GET_PROFILE_WITH_SKILLS } from '@/graphql/queries';
import type { UpdateProfileDto, CreateSkillDto } from '@/types/api';

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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({});

  const { data, loading, error } = useQuery(GET_PROFILE_WITH_SKILLS, {
    variables: { userId },
    skip: !userId,
  });

  const profile: ProfileWithSkills | null = (data as any)?.profileWithSkills ?? null;

  const updateProfileMutation = useMutation({
    mutationFn: (dto: UpdateProfileDto) => apiClient.put(`/api/profiles/${userId}`, dto),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_PROFILE_WITH_SKILLS] });
      setIsEditingProfile(false);
      setSnackbar({ open: true, message: 'Profile updated successfully.' });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update profile.';
      setSnackbar({ open: true, message: msg });
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: (dto: CreateSkillDto) => apiClient.post('/api/skills', dto),
    onSuccess: async () => {
      await apolloClient.refetchQueries({ include: [GET_PROFILE_WITH_SKILLS] });
      setNewSkill('');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add skill.';
      setSnackbar({ open: true, message: msg });
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
      setSnackbar({ open: true, message: msg });
      setDeleteSkillId(null);
    },
  });

  const handleAddSkill = () => {
    if (!newSkill.trim() || !profile) return;
    addSkillMutation.mutate({ profileId: profile.userId, skillName: newSkill.trim(), proficiencyLevel: 3 });
  };

  if (loading) {
    return (
      <AppShell breadcrumb="Settings">
        <div className="app-page max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Settings">
      <div className="app-page">
        <div className="max-w-3xl mx-auto">
          <PageHeader title="Profile & Settings" description="Manage your account and personal information." />

          <div className="md3-card mt-5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
                <span className="text-2xl font-medium text-[var(--md3-primary)]">{(user?.email ?? 'U')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-1">{user?.email}</h2>
                <p className="text-sm text-[var(--md3-on-surface-variant)] mb-2">{user?.role}</p>
              </div>
            </div>
          </div>

          <div className="md3-card mt-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Personal Information</h2>
              <ActionButton icon={Edit} label={isEditingProfile ? 'Cancel' : 'Edit'} onClick={() => setIsEditingProfile(!isEditingProfile)} />
            </div>

            {error ? (
              <p className="text-sm text-[var(--md3-error)]">Failed to load profile data.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">Bio</label>
                  {isEditingProfile ? (
                    <textarea
                      value={profileForm.bio ?? ''}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="md3-field h-20 w-full px-4 py-3 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-[var(--md3-on-surface-variant)]">{profile?.bioDescription ?? '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">University</label>
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">{profile?.university ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">Major</label>
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">{profile?.major ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">Year</label>
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">{profile?.studiedYear ?? '—'}</p>
                </div>
              </div>
            )}

            {isEditingProfile && (
              <div className="flex justify-end mt-4">
                <ActionButton
                  icon={Save}
                  label={updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  variant="primary"
                  size="md"
                  disabled={updateProfileMutation.isPending}
                  onClick={() => updateProfileMutation.mutate(profileForm)}
                />
              </div>
            )}
          </div>

          <div className="md3-card mt-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Skills</h2>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(profile?.skills ?? []).map((skill) => (
                <div key={skill.id} className="px-3 py-1.5 bg-[var(--md3-primary-container)] border-2 border-[#4285F4] text-[var(--md3-primary)] rounded-lg text-sm font-medium inline-flex items-center gap-2">
                  {skill.skillName}
                  <button onClick={() => setDeleteSkillId(skill.id)} className="hover:bg-[var(--md3-primary)] hover:text-white rounded-full p-0.5 transition-colors" aria-label={`Remove ${skill.skillName}`}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add a skill..."
                className="md3-field h-10 flex-1 px-3"
              />
              <ActionButton icon={Plus} label={addSkillMutation.isPending ? 'Adding...' : 'Add'} variant="primary" size="md" onClick={handleAddSkill} disabled={!newSkill.trim() || addSkillMutation.isPending} className="h-10" />
            </div>
          </div>

          <div className="md3-card mt-4 p-6">
            <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Security</h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">Account Email</h3>
                <p className="text-xs text-[var(--md3-on-surface-variant)] mt-1">{user?.email}</p>
              </div>
              <div className="px-2 py-1 bg-[var(--md3-success-container)] text-[var(--md3-success)] rounded text-xs font-medium inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border-2 border-[var(--md3-error-container)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-medium text-[var(--md3-error)] mb-4">Danger Zone</h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">Deactivate Account</h3>
                <p className="text-xs text-[var(--md3-on-surface-variant)]">Data preserved but access removed.</p>
              </div>
              <ActionButton icon={ShieldOff} label="Deactivate" variant="danger" size="md" onClick={() => setDeactivateOpen(true)} />
            </div>
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

      <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.message.includes('success') || snackbar.message.includes('updated') ? 'success' : 'error'} onClose={() => setSnackbar({ open: false, message: '' })} />
    </AppShell>
  );
}
