import { useState } from 'react';
import { AppShell, PageHeader } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormDialog, type FormDialogField } from '../components/FormDialog';
import { ActionButton } from '../components/ActionButton';
import { Edit, Check, X, Plus, Save, ShieldOff, KeyRound, Upload } from 'lucide-react';
import { appToast } from '../components/AppToast';

export function SettingsPage() {
  const [skills, setSkills] = useState(['JavaScript', 'React', 'Node.js', 'Python', 'Docker', 'PostgreSQL', 'TypeScript', 'Git']);
  const [newSkill, setNewSkill] = useState('');
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [skillToRemove, setSkillToRemove] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const profileFields: FormDialogField[] = [
    { name: 'fullName', label: 'Full Name', defaultValue: 'Nguyen Thanh' },
    { name: 'email', label: 'Email', defaultValue: 'thanh@rmit.edu.vn' },
    { name: 'phone', label: 'Phone', defaultValue: '' },
    { name: 'university', label: 'University', defaultValue: 'RMIT University Vietnam' },
    { name: 'major', label: 'Major', defaultValue: 'Computer Science' },
    { name: 'year', label: 'Year', type: 'select', options: ['1', '2', '3', '4'], defaultValue: '3' },
  ];

  return (
    <AppShell breadcrumb="Settings">
      <div className="app-page">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <PageHeader
            title="Profile & Settings"
            description="Manage your account and personal information."
          />

          {/* Account Section */}
          <div className="md3-card mt-5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
                <span className="text-2xl font-medium text-[var(--md3-primary)]">NT</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-1">Nguyen Thanh</h2>
                <p className="text-sm text-[var(--md3-on-surface-variant)] mb-2">thanh@rmit.edu.vn</p>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-[var(--md3-primary-container)] text-[var(--md3-primary)] rounded-lg text-xs font-medium">
                    Student
                  </div>
                  <ActionButton icon={Upload} label="Change photo" variant="text" />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="md3-card mt-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Personal Information</h2>
              <ActionButton
                icon={Edit}
                label="Edit"
                onClick={() => setProfileDialogOpen(true)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Nguyen Thanh"
                  className="md3-field w-full px-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    defaultValue="thanh@rmit.edu.vn"
                    className="md3-field w-full px-4 pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-[var(--md3-success-container)] text-[var(--md3-success)] rounded text-xs font-medium">
                    <Check className="w-3 h-3" />
                    Verified
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Optional"
                  className="md3-field w-full px-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                  University
                </label>
                <input
                  type="text"
                  defaultValue="RMIT University Vietnam"
                  className="md3-field w-full px-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                  Major
                </label>
                <input
                  type="text"
                  defaultValue="Computer Science"
                  className="md3-field w-full px-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                  Year
                </label>
                <select className="md3-field w-full px-4">
                  <option>1</option>
                  <option>2</option>
                  <option selected>3</option>
                  <option>4</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <ActionButton icon={Save} label="Save Changes" variant="primary" size="md" />
            </div>
          </div>

          {/* Bio */}
          <div className="md3-card mt-4 p-6">
            <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Bio</h2>
            <textarea
              placeholder="Tell employers about yourself..."
              defaultValue="Passionate software engineering student with a focus on full-stack development. Building modern web applications with React, Node.js, and cloud technologies."
              className="md3-field h-24 w-full resize-none px-4 py-3"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-[var(--md3-on-surface-variant)]">182 / 500</span>
            </div>
          </div>

          {/* Skills */}
          <div className="md3-card mt-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[var(--md3-on-surface)]">Skills</h2>
              <ActionButton icon={Plus} label="Add Skill" onClick={handleAddSkill} />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-[var(--md3-primary-container)] border-2 border-[var(--md3-status-in-progress-stroke)] text-[var(--md3-primary)] rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => setSkillToRemove(skill)}
                    className="hover:bg-[var(--md3-primary)] hover:text-white rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${skill}`}
                  >
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
              <ActionButton
                icon={Plus}
                label="Add"
                variant="primary"
                size="md"
                onClick={handleAddSkill}
                className="h-10"
              />
            </div>
          </div>

          {/* Security */}
          <div className="md3-card mt-4 p-6">
            <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Security</h2>

            <div className="border-b border-[var(--md3-outline-variant)] pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-1">Password</h3>
                  <p className="text-xs text-[var(--md3-on-surface-variant)]">Last changed 3 months ago</p>
                </div>
                <ActionButton icon={KeyRound} label="Change password" variant="text" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-1">Google Account</h3>
                <p className="text-xs text-[var(--md3-on-surface-variant)]">Connected — thanh@gmail.com</p>
              </div>
              <div className="px-3 py-1 bg-[var(--md3-success-container)] text-[var(--md3-success)] rounded text-xs font-medium inline-flex items-center gap-1">
                <Check className="w-3 h-3" />
                Connected
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-4 rounded-xl border-2 border-[var(--md3-error-container)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-medium text-[var(--md3-error)] mb-4">Danger Zone</h2>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-1">Deactivate Account</h3>
                <p className="text-xs text-[var(--md3-on-surface-variant)]">
                  Data preserved but access removed.
                </p>
              </div>
              <ActionButton
                icon={ShieldOff}
                label="Deactivate"
                variant="danger"
                size="md"
                onClick={() => setDeactivateOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deactivateOpen}
        title="Deactivate Account?"
        message="Your profile, roadmaps, skills, chat sessions, and repositories will be preserved, but your active sessions will be revoked and you will lose access until an administrator reactivates the account."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => {
          setDeactivateOpen(false);
          appToast.success('Account deactivation queued');
        }}
        onCancel={() => setDeactivateOpen(false)}
      />

      <FormDialog
        isOpen={profileDialogOpen}
        title="Edit Personal Information"
        description="Update the profile fields used across your roadmap and portfolio."
        fields={profileFields}
        onCancel={() => setProfileDialogOpen(false)}
        onSubmit={() => {
          setProfileDialogOpen(false);
          appToast.success('Profile updated');
        }}
      />

      <ConfirmDialog
        isOpen={skillToRemove !== null}
        title="Remove Skill?"
        message={`This removes ${skillToRemove ?? 'this skill'} from your profile skill list.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (skillToRemove) {
            handleRemoveSkill(skillToRemove);
          }
          setSkillToRemove(null);
          appToast.success('Skill removed');
        }}
        onCancel={() => setSkillToRemove(null)}
      />
    </AppShell>
  );
}

