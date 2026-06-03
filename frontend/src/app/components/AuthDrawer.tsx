import { BarChart3, Compass, Route, Sparkles } from 'lucide-react';

export function AuthDrawer() {
  const features = [
    { icon: Route, title: 'Career roadmaps', detail: 'Structured paths from fundamentals to job-ready milestones.' },
    { icon: BarChart3, title: 'Market skill trends', detail: 'Demand signals keep each roadmap aligned with real hiring needs.' },
  ];

  return (
    <div
      className="relative hidden h-full w-[500px] shrink-0 overflow-hidden p-12 lg:flex lg:flex-col"
      style={{
        background: 'linear-gradient(160deg, #1A73E8 0%, #0D47A1 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.2) 1px, transparent 1px),
            radial-gradient(circle at 24px 24px, rgba(255,255,255,0.28) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px, 24px 24px',
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Compass className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-bold leading-tight text-white">SECompass</h1>
            <p className="text-sm font-medium text-white/80">From Generalist to Job-Ready.</p>
          </div>
        </div>

        <div className="mt-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-xs font-medium text-white">
            <Sparkles className="h-4 w-4" />
            AI-powered career orientation
          </div>
          <h2 className="mt-6 max-w-[390px] text-[38px] font-semibold leading-tight text-white">
            Turn scattered learning into a clear execution plan.
          </h2>
          <p className="mt-5 max-w-[390px] text-base leading-7 text-white/78">
            SECompass gives software engineering students a desktop workspace for roadmaps,
            skill gaps, market trends, portfolio work, and AI guidance.
          </p>
        </div>

        <div className="mt-10 grid max-w-[390px] grid-cols-3 gap-3">
          {[
            ['50+', 'Roles'],
            ['24', 'Avg nodes'],
            ['67%', 'Progress'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-white/14 bg-white/10 p-3">
              <p className="text-xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-[11px] font-medium text-white/68">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-[390px] space-y-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex gap-3 rounded-xl border border-white/14 bg-white/10 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/16">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/70">{feature.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto border-t border-white/14 pt-5">
          <p className="text-xs font-medium text-white/62">Trusted by 2,000+ software engineering students</p>
        </div>
      </div>
    </div>
  );
}
