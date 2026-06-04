import { Compass, TrendingUp, Star, ArrowRight, Play } from 'lucide-react';
import { ActionAnchor, ActionLink } from '../components/ActionButton';
import { PublicLayout } from '../components/PublicLayout';

export function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section
        className="pt-16 pb-20 px-6"
        style={{
          background: 'linear-gradient(180deg, #EBF3FF 0%, #FFFFFF 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Text Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--md3-primary-container)] text-[var(--md3-primary)] rounded-full text-xs font-medium">
                <span>✦</span> AI-Powered Career Platform
              </div>

              <div className="space-y-2">
                <h1 className="text-5xl font-bold text-[var(--md3-on-surface)] leading-tight">
                  Find your engineering north star.
                </h1>
                <h1 className="text-5xl font-bold text-[var(--md3-primary)] leading-tight">
                  Go from generalist to job-ready.
                </h1>
              </div>

              <p className="text-lg text-[var(--md3-on-surface-variant)] leading-relaxed max-w-lg">
                SECompass is an AI-powered platform that helps software engineering students build personalized learning roadmaps,
                track their progress, and make data-driven career decisions with real-time market insights.
              </p>

              <div className="flex items-center gap-4 pt-2">
                <ActionLink
                  icon={ArrowRight}
                  label="Start for free"
                  to="/register"
                  variant="primary"
                  size="lg"
                  className="shadow-md"
                />
                <ActionAnchor icon={Play} label="See how it works" href="#how-it-works" variant="text" size="lg" />
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-[var(--md3-primary-container)] border-2 border-white flex items-center justify-center"
                    >
                      <span className="text-xs text-[var(--md3-primary)]">👤</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-[var(--md3-on-surface-variant)]">Trusted by 2,000+ SE students</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-[var(--md3-warning)] text-[var(--md3-warning)]" />
                    ))}
                    <span className="text-xs text-[var(--md3-warning)] ml-1">4.9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Column */}
            <div className="relative">
              <div
                className="bg-white rounded-3xl p-8 shadow-xl"
                style={{
                  boxShadow: '0 6px 12px rgba(0,0,0,0.14)',
                }}
              >
                <div className="space-y-4">
                  {/* Roadmap Preview */}
                  <div className="space-y-3">
                    <RoadmapNode status="completed" title="HTML & CSS" />
                    <RoadmapNode status="completed" title="JavaScript Fundamentals" />
                    <RoadmapNode status="in-progress" title="React Basics" />
                    <RoadmapNode status="in-progress" title="TypeScript" />
                    <RoadmapNode status="not-started" title="Node.js Backend" />
                    <RoadmapNode status="not-started" title="Database Design" />
                    <RoadmapNode status="not-started" title="Deployment & CI/CD" />
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-4 border-t border-[var(--md3-outline-variant)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--md3-on-surface)]">Frontend Developer</span>
                      <span className="text-sm font-medium text-[var(--md3-success)]">67%</span>
                    </div>
                    <div className="h-2 bg-[var(--md3-outline-variant)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--md3-success)] w-2/3 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 px-4 py-2 bg-[var(--md3-success-container)] text-[var(--md3-success)] rounded-full text-xs font-medium shadow-md flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--md3-success)] rounded-full animate-pulse" />
                  AI Mentor Active
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl px-4 py-2 shadow-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--md3-success)]" />
                  <span className="text-xs text-[var(--md3-on-surface)]">React ranked #1 in Vietnam 🇻🇳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-12 bg-[var(--md3-primary)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem number="2,000+" label="Students" />
            <StatItem number="50+" label="Career Roles" />
            <StatItem number="98%" label="Satisfaction" />
            <StatItem number="Real-Time" label="Market Data" />
          </div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section id="features" className="py-24 bg-[var(--md3-surface-container)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-medium text-[var(--md3-primary)] uppercase tracking-wider mb-3">Why SECompass</p>
            <h2 className="text-4xl font-semibold text-[var(--md3-on-surface)] mb-4">
              SE students don't fail from effort. They fail from lack of direction.
            </h2>
            <p className="text-lg text-[var(--md3-on-surface-variant)]">
              We help you navigate your career with AI-powered insights and personalized learning paths.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ProblemCard
              icon="⚠️"
              title="Skill Gaps"
              description="Students often don't know what they don't know. Our AI identifies exactly what skills you're missing for your target role."
              color="warning"
            />
            <ProblemCard
              icon="🤔"
              title="Choice Paralysis"
              description="Too many technologies, too many paths. We help you choose the right path based on market demand and your goals."
              color="error"
            />
            <ProblemCard
              icon="💼"
              title="Weak Portfolio Story"
              description="Projects without purpose don't impress. We help you build a portfolio that tells a compelling career story."
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Your engineering career starts with one click.
          </h2>
          <p className="text-lg text-white/85 mb-8">
            Join thousands of students who are building their careers with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ActionLink
              icon={ArrowRight}
              label="Get started free"
              to="/register"
              variant="neutral"
              size="lg"
              className="border-transparent bg-white text-[var(--md3-primary)]"
            />
            <ActionAnchor
              icon={Play}
              label="Watch demo"
              href="#how-it-works"
              variant="neutral"
              size="lg"
              className="border-white bg-white/15 text-white shadow-sm hover:border-white hover:bg-white hover:text-[var(--md3-primary)]"
            />
          </div>
          <p className="text-sm text-white/70 mt-6">Free to start · No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[var(--md3-on-surface)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Compass className="w-6 h-6 text-white" />
                <span className="text-lg font-bold text-white">SECompass</span>
              </div>
              <p className="text-sm text-white/60">From Generalist to Job-Ready.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmaps</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Mentor</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-white mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-white mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-white/40 text-center">© 2025 SECompass. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}

function RoadmapNode({ status, title }: { status: 'completed' | 'in-progress' | 'not-started'; title: string }) {
  const colors = {
    completed: {
      bg: 'var(--md3-status-completed-fill)',
      text: 'var(--md3-status-completed-text)',
      border: 'var(--md3-status-completed-stroke)',
    },
    'in-progress': {
      bg: 'var(--md3-status-in-progress-fill)',
      text: 'var(--md3-status-in-progress-text)',
      border: 'var(--md3-status-in-progress-stroke)',
    },
    'not-started': {
      bg: 'var(--md3-status-not-started-fill)',
      text: 'var(--md3-status-not-started-text)',
      border: 'var(--md3-status-not-started-stroke)',
    },
  };

  return (
    <div
      className="px-4 py-3 rounded-xl border-2 text-sm font-medium relative"
      style={{
        backgroundColor: colors[status].bg,
        color: colors[status].text,
        borderColor: colors[status].border,
      }}
    >
      {title}
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: colors[status].border }}
      />
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-white mb-1">{number}</div>
      <div className="text-sm text-white/85">{label}</div>
    </div>
  );
}

function ProblemCard({ icon, title, description, color }: { icon: string; title: string; description: string; color: 'warning' | 'error' | 'purple' }) {
  const bgColors = {
    warning: 'var(--md3-warning-container)',
    error: 'var(--md3-error-container)',
    purple: '#F3E8FD',
  };

  const iconColors = {
    warning: 'var(--md3-warning)',
    error: 'var(--md3-error)',
    purple: '#7B1FA2',
  };

  return (
    <div className="bg-white rounded-xl p-7 shadow-sm">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
        style={{ backgroundColor: bgColors[color], color: iconColors[color] }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[var(--md3-on-surface)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--md3-on-surface-variant)] leading-relaxed">{description}</p>
    </div>
  );
}
