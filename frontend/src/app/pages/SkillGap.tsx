import { AppShell, PageHeader } from '../components/AppShell';
import { ActionButton } from '../components/ActionButton';
import { Download, Check, Plus, SlidersHorizontal } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { appToast } from '../components/AppToast';

const skillCoverageData = [
  { skill: 'React', current: 90, required: 85 },
  { skill: 'Node.js', current: 60, required: 85 },
  { skill: 'Databases', current: 70, required: 80 },
  { skill: 'Docker', current: 40, required: 75 },
  { skill: 'Testing', current: 55, required: 75 },
  { skill: 'System Design', current: 30, required: 70 },
];

const missingSkills: Array<{
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTime: string;
}> = [
  { name: 'Docker', priority: 'High', estimatedTime: '~3 months' },
  { name: 'System Design', priority: 'High', estimatedTime: '~4 months' },
  { name: 'Kubernetes', priority: 'Medium', estimatedTime: '~3 months' },
  { name: 'Microservices', priority: 'Medium', estimatedTime: '~2 months' },
  { name: 'Redis', priority: 'Low', estimatedTime: '~1 month' },
];

const careerRoles = [
  { id: 1, name: 'Backend Developer', selected: true },
  { id: 2, name: 'Full Stack Developer', selected: false },
  { id: 3, name: 'DevOps Engineer', selected: false },
];

export function SkillGapPage() {
  const matchPercentage = 42;

  return (
    <AppShell breadcrumb="Skill Gap Analysis">
      <div className="app-page">
        <PageHeader
          title="Skill Gap Analysis"
          description="See exactly where you stand against your target role."
          actions={
            <ActionButton icon={Download} label="Export PDF" variant="neutral" size="md" />
          }
        />

        {/* Stepper */}
        <div className="md3-card p-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <StepItem number={1} label="Your Skills" completed />
            <div className="flex-1 h-0.5 bg-[var(--md3-success)] mx-4" />
            <StepItem number={2} label="Target Role" completed />
            <div className="flex-1 h-0.5 bg-[var(--md3-success)] mx-4" />
            <StepItem number={3} label="Results" active />
          </div>
        </div>

        {/* Results Grid */}
        <div className="desktop-grid-2">
          {/* Skill Coverage Card */}
          <div className="md3-card p-6">
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-2">Skill Coverage</h2>
            <p className="text-sm text-[var(--md3-on-surface-variant)] mb-6">
              Your skills vs. role requirements
            </p>

            <div className="h-[280px] flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillCoverageData}>
                  <PolarGrid stroke="#E8EAED" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#5F6368' }} />
                  <Radar
                    name="Your Skills"
                    dataKey="current"
                    stroke="#1A73E8"
                    fill="#1A73E8"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Required"
                    dataKey="required"
                    stroke="#FBBC04"
                    fill="#FBBC04"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--md3-primary)]" />
                <span className="text-sm font-medium text-[var(--md3-on-surface)]">Your Skills</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--md3-warning)]" />
                <span className="text-sm font-medium text-[var(--md3-on-surface)]">Required</span>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-[var(--md3-error)] mb-1">{matchPercentage}%</div>
              <p className="text-sm font-medium text-[var(--md3-on-surface-variant)]">
                of required skills matched
              </p>
            </div>

            <ActionButton icon={SlidersHorizontal} label="Refine Skills" className="w-full" size="lg" />
          </div>

          {/* Missing Skills Card */}
          <div className="md3-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)] mb-1">Missing Skills</h2>
                <p className="text-sm text-[var(--md3-on-surface-variant)]">
                  {missingSkills.length} skills to develop
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <FilterChip label="All" active />
              <FilterChip label="High Priority" />
              <FilterChip label="Medium" />
              <FilterChip label="Low" />
            </div>

            <div className="space-y-3">
              {missingSkills.map((skill, index) => (
                <SkillCard key={index} {...skill} />
              ))}
            </div>
          </div>
        </div>

        {/* Change Target Role */}
        <div className="md3-card p-6">
          <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Change Target Role</h2>
          <div className="flex flex-wrap gap-3">
            {careerRoles.map((role) => (
              <RoleChip key={role.id} {...role} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StepItem({ number, label, completed, active }: { number: number; label: string; completed?: boolean; active?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
          completed
            ? 'bg-[var(--md3-success)] text-white'
            : active
            ? 'bg-[var(--md3-primary)] text-white'
            : 'border-2 border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)]'
        }`}
      >
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span
        className={`text-sm font-medium ${
          active ? 'text-[var(--md3-primary)]' : 'text-[var(--md3-on-surface-variant)]'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg border-2 font-medium text-sm transition-all ${
        active
          ? 'bg-[var(--md3-primary-container)] border-[var(--md3-status-in-progress-stroke)] text-[var(--md3-primary)]'
          : 'bg-white border-[var(--md3-outline)] text-[var(--md3-on-surface-variant)] hover:border-[var(--md3-on-surface-variant)]'
      }`}
    >
      {active && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

function SkillCard({ name, priority, estimatedTime }: { name: string; priority: 'High' | 'Medium' | 'Low'; estimatedTime: string }) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'High':
        return { bg: 'var(--md3-error-container)', text: 'var(--md3-error)' };
      case 'Medium':
        return { bg: 'var(--md3-warning-container)', text: 'var(--md3-warning)' };
      case 'Low':
        return { bg: 'var(--md3-success-container)', text: 'var(--md3-success)' };
    }
  };

  const colors = getPriorityColor();

  return (
    <div className="bg-[var(--md3-surface-container)] rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[var(--md3-surface-variant)] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[var(--md3-on-surface-variant)]" />
          </div>
          <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">{name}</h3>
        </div>
        <div
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {priority}
        </div>
      </div>
      <div className="flex items-center justify-between pl-9">
        <span className="text-xs text-[var(--md3-on-surface-variant)]">{estimatedTime}</span>
        <ActionButton
          icon={Plus}
          label="Add to roadmap"
          variant="text"
          onClick={() => appToast.success(`${name} added to roadmap backlog`)}
        />
      </div>
    </div>
  );
}

function RoleChip({ name, selected }: { name: string; selected: boolean }) {
  return (
    <button
      className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
        selected
          ? 'bg-[var(--md3-primary-container)] border-[var(--md3-status-in-progress-stroke)] text-[var(--md3-primary)]'
          : 'bg-[var(--md3-surface-variant)] border-[var(--md3-outline)] text-[var(--md3-on-surface)] hover:border-[var(--md3-on-surface-variant)]'
      }`}
    >
      {selected && <Check className="inline w-4 h-4 mr-1" />}
      {name}
    </button>
  );
}

