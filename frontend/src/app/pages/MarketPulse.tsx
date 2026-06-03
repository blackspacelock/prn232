import { AppShell, PageHeader } from '../components/AppShell';
import { ActionButton } from '../components/ActionButton';
import { Search, Calendar, Filter, RotateCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';

const trendData = [
  { month: 'Jan', React: 85, Python: 78, Kubernetes: 65 },
  { month: 'Feb', React: 88, Python: 80, Kubernetes: 68 },
  { month: 'Mar', React: 90, Python: 82, Kubernetes: 70 },
  { month: 'Apr', React: 92, Python: 85, Kubernetes: 73 },
  { month: 'May', React: 95, Python: 87, Kubernetes: 75 },
  { month: 'Jun', React: 98, Python: 90, Kubernetes: 78 },
];

const topSkills = [
  { name: 'React', score: 98, source: 'LinkedIn', region: 'Vietnam', date: 'Jun 3, 2025', isTop: true },
  { name: 'Python', score: 90, source: 'TopCV', region: 'Vietnam', date: 'Jun 3, 2025', isTop: false },
  { name: 'Kubernetes', score: 78, source: 'LinkedIn', region: 'Vietnam', date: 'Jun 2, 2025', isTop: false },
  { name: 'TypeScript', score: 85, source: 'TopCV', region: 'Vietnam', date: 'Jun 2, 2025', isTop: false },
  { name: 'Docker', score: 82, source: 'LinkedIn', region: 'Vietnam', date: 'Jun 1, 2025', isTop: false },
  { name: 'Node.js', score: 88, source: 'TopCV', region: 'Vietnam', date: 'Jun 1, 2025', isTop: false },
];

export function MarketPulsePage() {
  return (
    <AppShell breadcrumb="Market Pulse">
      <div className="app-page">
        <PageHeader
          title="Market Pulse"
          description="Real-time demand data for software engineering skills."
        />

        {/* Filter Bar */}
        <div className="md3-panel flex flex-wrap items-center gap-3 p-4">
          <select className="md3-field min-w-[180px] px-4">
            <option>Vietnam</option>
            <option>Singapore</option>
            <option>Thailand</option>
            <option>Global</option>
          </select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Filter by skill..."
              className="md3-field w-full pl-12 pr-4"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            <input
              type="text"
              placeholder="From date"
              className="md3-field w-[150px] pl-12 pr-4"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md3-on-surface-variant)]" />
            <input
              type="text"
              placeholder="To date"
              className="md3-field w-[150px] pl-12 pr-4"
            />
          </div>

          <ActionButton icon={Filter} label="Apply" variant="primary" size="md" />

          <ActionButton icon={RotateCcw} label="Reset" variant="text" size="md" />
        </div>

        {/* Main Chart */}
        <div className="md3-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[var(--md3-on-surface)]">Skill Demand Trends</h2>
            <span className="text-sm font-medium text-[var(--md3-on-surface-variant)]">Jan 2025 – Jun 2025</span>
          </div>

          <div className="h-[280px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorReact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPython" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E8E3E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1E8E3E" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorKubernetes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B1FA2" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7B1FA2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5F6368' }} />
                <YAxis tick={{ fontSize: 12, fill: '#5F6368' }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="React" stroke="#1A73E8" fill="url(#colorReact)" strokeWidth={2} />
                <Area type="monotone" dataKey="Python" stroke="#1E8E3E" fill="url(#colorPython)" strokeWidth={2} />
                <Area type="monotone" dataKey="Kubernetes" stroke="#7B1FA2" fill="url(#colorKubernetes)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--md3-primary)]" />
              <span className="text-xs font-medium text-[var(--md3-on-surface)]">React</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--md3-success)]" />
              <span className="text-xs font-medium text-[var(--md3-on-surface)]">Python</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#7B1FA2' }} />
              <span className="text-xs font-medium text-[var(--md3-on-surface)]">Kubernetes</span>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="desktop-grid-3">
          {topSkills.map((skill, index) => (
            <SkillCard key={index} {...skill} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-lg border border-[var(--md3-outline-variant)]">
        <p className="text-sm font-medium text-[var(--md3-on-surface)] mb-2">{label} 2025</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-[var(--md3-on-surface-variant)]">{entry.name}</span>
            </div>
            <span className="text-xs font-medium text-[var(--md3-on-surface)]">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function SkillCard({ name, score, source, region, date, isTop }: {
  name: string;
  score: number;
  source: string;
  region: string;
  date: string;
  isTop: boolean;
}) {
  return (
    <div
      className="md3-card relative p-5"
      style={isTop ? { borderLeft: '3px solid var(--md3-primary)' } : {}}
    >
      <h3 className="text-base font-medium text-[var(--md3-on-surface)] mb-3">{name}</h3>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-bold text-[var(--md3-on-surface)]">{score}</span>
        <span className="text-lg text-[var(--md3-on-surface-variant)]">/100</span>
      </div>

      <div className="h-1.5 bg-[var(--md3-outline-variant)] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[var(--md3-primary)] transition-all rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium font-mono"
          style={{
            backgroundColor: source === 'LinkedIn' ? 'var(--md3-primary-container)' : '#F3E8FD',
            color: source === 'LinkedIn' ? 'var(--md3-primary)' : '#7B1FA2',
          }}
        >
          {source}
        </span>
        <span className="px-2 py-0.5 bg-[var(--md3-surface-variant)] rounded text-xs text-[var(--md3-on-surface-variant)]">
          {region}
        </span>
      </div>

      <span className="text-xs text-[var(--md3-on-surface-variant)]">{date}</span>
    </div>
  );
}
