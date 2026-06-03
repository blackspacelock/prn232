import { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Rocket, Search, X } from 'lucide-react';
import { ActionButton } from './ActionButton';

interface GenerateRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (roleId: number, note: string) => void;
}

const careerRoles = [
  { id: 1, name: 'Frontend Developer', icon: '💻', roadmapCount: 3 },
  { id: 2, name: 'Backend Developer', icon: '⚙️', roadmapCount: 2 },
  { id: 3, name: 'Full Stack Developer', icon: '🔄', roadmapCount: 4 },
  { id: 4, name: 'DevOps Engineer', icon: '🚀', roadmapCount: 2 },
  { id: 5, name: 'Mobile Developer', icon: '📱', roadmapCount: 2 },
  { id: 6, name: 'Data Engineer', icon: '📊', roadmapCount: 3 },
];

export function GenerateRoadmapModal({ isOpen, onClose, onGenerate }: GenerateRoadmapModalProps) {
  const [step, setStep] = useState<'select-role' | 'confirm' | 'generating'>('select-role');
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredRoles = careerRoles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedRoleData = careerRoles.find(r => r.id === selectedRole);

  const handleNext = () => {
    if (selectedRole) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    setStep('select-role');
  };

  const handleGenerate = () => {
    if (selectedRole) {
      setStep('generating');
      setTimeout(() => {
        onGenerate(selectedRole, note);
        handleReset();
      }, 2000);
    }
  };

  const handleReset = () => {
    setStep('select-role');
    setSelectedRole(null);
    setNote('');
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={step !== 'generating' ? handleReset : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[640px] mx-4">
        {step === 'select-role' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-1">
                  Generate Your Roadmap
                </h2>
                <p className="text-sm text-[var(--md3-on-surface-variant)]">
                  Select a career role to get started
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--md3-primary)] text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="text-sm font-medium text-[var(--md3-primary)]">Select Role</span>
              </div>
              <div className="flex-1 h-px bg-[var(--md3-outline)]" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm font-medium text-[var(--md3-on-surface-variant)]">Confirm</span>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search career roles..."
                className="md3-field h-10 w-full rounded-full pl-10 pr-4 text-sm"
              />
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-[320px] overflow-y-auto mb-6">
              {filteredRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`relative p-3 rounded-lg border-2 transition-all hover:border-[var(--md3-on-surface-variant)] ${
                    selectedRole === role.id
                      ? 'bg-[var(--md3-primary-container)] border-[var(--md3-primary)]'
                      : 'bg-white border-[var(--md3-outline)]'
                  }`}
                >
                  <div className="text-2xl mb-2">{role.icon}</div>
                  <h3 className="text-sm font-medium text-[var(--md3-on-surface)] mb-1 text-center">
                    {role.name}
                  </h3>
                  <p className="text-xs text-[var(--md3-on-surface-variant)] text-center">
                    {role.roadmapCount} roadmaps
                  </p>
                  {selectedRole === role.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--md3-primary)] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <ActionButton
                icon={X}
                label="Cancel"
                variant="text"
                onClick={handleReset}
              />
              <ActionButton
                icon={ChevronRight}
                label="Next"
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={!selectedRole}
              />
            </div>
          </div>
        )}

        {step === 'confirm' && selectedRoleData && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-1">
                  Generate Your Roadmap
                </h2>
                <p className="text-sm text-[var(--md3-on-surface-variant)]">
                  Review and confirm your selection
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-10 h-10 flex items-center justify-center hover:bg-[var(--md3-surface-variant)] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[var(--md3-on-surface-variant)]" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--md3-success)] text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-[var(--md3-on-surface-variant)]">Select Role</span>
              </div>
              <div className="flex-1 h-px bg-[var(--md3-success)]" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--md3-primary)] text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm font-medium text-[var(--md3-primary)]">Confirm</span>
              </div>
            </div>

            {/* Selected Role */}
            <div className="bg-[var(--md3-primary-container)] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">{selectedRoleData.icon}</div>
                <div>
                  <h3 className="text-base font-medium text-[var(--md3-primary)]">
                    {selectedRoleData.name}
                  </h3>
                  <p className="text-sm text-[var(--md3-on-surface-variant)]">
                    24 nodes · 4 phases
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Fundamentals', 'Frontend', 'Backend', 'Advanced'].map((phase, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 bg-[var(--md3-surface-variant)] border border-[var(--md3-outline)] rounded text-xs text-[var(--md3-on-surface-variant)]"
                  >
                    {phase}
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--md3-on-surface)] mb-2">
                Personal note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any specific goals or preferences..."
                className="md3-field h-20 w-full resize-none px-4 py-3 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <ActionButton
                icon={ArrowLeft}
                label="Back"
                variant="text"
                onClick={handleBack}
              />
              <ActionButton
                icon={Rocket}
                label="Generate Roadmap"
                variant="primary"
                size="md"
                onClick={handleGenerate}
              />
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="p-10 text-center">
            <div className="w-12 h-12 border-4 border-[var(--md3-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">
              Building your roadmap...
            </h2>
            <p className="text-sm text-[var(--md3-on-surface-variant)]">
              Setting up 24 nodes and progress tracking
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
