import { Link } from 'react-router';
import { ActionAnchor, ActionButton } from '../components/ActionButton';
import { Compass, Github, Linkedin, ExternalLink, Copy, Mail } from 'lucide-react';

const skills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL',
  'Docker', 'Git', '.NET', 'GraphQL', 'REST API', 'CI/CD'
];

const roadmaps = [
  { name: 'Frontend Developer', progress: 75, role: 'Primary' },
  { name: 'Backend Developer', progress: 30, role: 'Secondary' },
];

const projects = [
  {
    name: 'E-commerce Platform',
    summary: 'Full-stack e-commerce application with React, Node.js, and PostgreSQL. Features include user authentication, shopping cart, and payment integration.',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    name: 'Task Management API',
    summary: 'RESTful API for task management with authentication and real-time updates using WebSocket.',
    technologies: ['Express', 'MongoDB', 'Socket.io'],
  },
  {
    name: 'Real-time Chat App',
    summary: 'Real-time messaging application with group chat and file sharing capabilities.',
    technologies: ['React', 'Firebase', 'TypeScript'],
  },
];

export function PublicPortfolioPage() {
  return (
    <div className="min-h-screen bg-[var(--md3-surface-container)]">
      {/* Navbar */}
      <nav className="h-14 bg-white border-b border-[var(--md3-outline-variant)] sticky top-0 z-50">
        <div className="max-w-[860px] mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--md3-primary)]" />
            <span className="text-base font-bold text-[var(--md3-primary)]">SECompass</span>
          </Link>

          <div className="flex items-center gap-3">
            <ActionButton icon={Copy} label="Copy Link" variant="neutral" size="md" />
            <ActionButton icon={Mail} label="Contact Me" variant="primary" size="md" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-[860px] mx-auto px-6 py-6 space-y-4">
        {/* Profile Header */}
        <div className="md3-card p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-[72px] h-[72px] rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
              <span className="text-2xl font-medium text-[var(--md3-primary)]">NT</span>
            </div>
            <div className="flex-1">
              <h1 className="text-[32px] font-semibold leading-tight text-[var(--md3-on-surface)] mb-1">Nguyen Thanh</h1>
              <p className="text-lg text-[var(--md3-on-surface-variant)] mb-2">Software Engineering Student</p>
              <div className="flex items-center gap-2 text-sm text-[var(--md3-on-surface-variant)]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                RMIT University Vietnam
              </div>
            </div>
          </div>

          <p className="text-base text-[var(--md3-on-surface)] leading-relaxed mb-4">
            Passionate software engineering student with a focus on full-stack development.
            Building modern web applications with React, Node.js, and cloud technologies.
            Currently learning DevOps practices and expanding into machine learning.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-[var(--md3-on-surface-variant)] hover:text-[var(--md3-primary)] transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-[var(--md3-on-surface-variant)] hover:text-[var(--md3-primary)] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Skills */}
        <div className="md3-card p-6">
          <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Technical Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="md3-chip md3-chip-selected"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Progress */}
        <div className="md3-card p-6">
          <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Learning Roadmaps</h2>
          <div className="space-y-4">
            {roadmaps.map((roadmap, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">{roadmap.name}</h3>
                    <span className="px-2 py-0.5 bg-[var(--md3-primary-container)] text-[var(--md3-primary)] rounded text-xs">
                      {roadmap.role}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[var(--md3-success)]">{roadmap.progress}%</span>
                </div>
                <div className="h-1.5 bg-[var(--md3-outline-variant)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--md3-success)] transition-all"
                    style={{ width: `${roadmap.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="md3-card p-6">
          <h2 className="text-base font-medium text-[var(--md3-on-surface)] mb-4">Projects</h2>
          <div className="grid gap-3">
            {projects.map((project, index) => (
              <div key={index} className="border border-[var(--md3-outline-variant)] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-[var(--md3-on-surface)]">{project.name}</h3>
                  <ActionAnchor
                    icon={ExternalLink}
                    label="Open"
                    href="#"
                    variant="text"
                    className="shrink-0"
                  />
                </div>
                <p className="text-xs text-[var(--md3-on-surface-variant)] italic mb-3 leading-relaxed">
                  {project.summary}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-0.5 bg-[var(--md3-surface-variant)] border border-[var(--md3-outline)] rounded text-xs font-mono text-[var(--md3-on-surface-variant)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 border-t border-[var(--md3-outline-variant)] text-center">
          <p className="text-xs text-[var(--md3-on-surface-variant)] mb-1">Built with SECompass</p>
          <a href="/" className="text-xs font-medium text-[var(--md3-primary)] hover:underline">
            secompass.io
          </a>
        </div>
      </div>
    </div>
  );
}
