import { AppShell } from '../components/AppShell';
import { FormDialog, type FormDialogField } from '../components/FormDialog';
import { ActionButton } from '../components/ActionButton';
import { Plus, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { appToast } from '../components/AppToast';

const initialSessions = [
  { title: 'Career path for backend dev', preview: 'How do I transition...', time: '2h ago', active: true },
  { title: 'Learning roadmap advice', preview: "What's the best order...", time: 'Yesterday' },
  { title: 'Portfolio project ideas', preview: 'I need help choosing...', time: '3 days ago' },
];

export function MentorPage() {
  const [message, setMessage] = useState('');
  const [sessions, setSessions] = useState(initialSessions);
  const [newSessionOpen, setNewSessionOpen] = useState(false);

  const sessionFields: FormDialogField[] = [
    { name: 'title', label: 'Session title', defaultValue: 'New mentor session', colSpan: 2 },
    { name: 'summary', label: 'Goal or question', type: 'textarea', colSpan: 2 },
  ];

  return (
    <AppShell breadcrumb="AI Mentor" className="app-main--flush">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="hidden w-[280px] flex-col border-r border-[var(--md3-outline-variant)] bg-white lg:flex">
          <div className="p-4 border-b border-[var(--md3-outline-variant)] flex items-center justify-between">
            <h2 className="text-base font-medium text-[var(--md3-on-surface)]">AI Mentor</h2>
            <ActionButton
              icon={Plus}
              label="New"
              onClick={() => setNewSessionOpen(true)}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-xs font-medium text-[var(--md3-on-surface-variant)] px-4 py-2 uppercase">Recent</p>
            {sessions.map((session) => (
              <ChatSession key={session.title} {...session} />
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[var(--md3-surface-container)]">
          {/* Header */}
          <div className="h-16 bg-white border-b border-[var(--md3-outline-variant)] px-5 flex items-center justify-between">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)]">Career path for backend dev...</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <UserMessage text="What skills do I need to become a backend developer?" />
            <AssistantMessage text="To become a backend developer, you'll need to master several key skills: 1) A backend programming language (Node.js, Python, Java, or Go), 2) Database management (SQL and NoSQL), 3) API design (REST, GraphQL), 4) Authentication and security, 5) Server deployment and DevOps basics. Would you like me to create a detailed roadmap for you?" />
            <UserMessage text="Yes, create a Node.js backend roadmap" />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-[var(--md3-outline-variant)] p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask your AI Mentor..."
                className="flex-1 h-12 px-4 bg-white border-2 border-[var(--md3-outline)] rounded-full focus:border-[var(--md3-primary)] focus:outline-none"
              />
              <ActionButton
                icon={Send}
                label="Send"
                variant="primary"
                size="md"
                disabled={!message}
                className="h-12"
              />
            </div>
            <p className="text-xs text-[var(--md3-on-surface-variant)] mt-2 text-center">
              Personalized to your profile and roadmap.
            </p>
          </div>
        </div>
      </div>

      <FormDialog
        isOpen={newSessionOpen}
        title="Create Chat Session"
        description="Start a focused AI mentor conversation."
        fields={sessionFields}
        submitLabel="Create Session"
        onCancel={() => setNewSessionOpen(false)}
        onSubmit={(values) => {
          setSessions([
            {
              title: String(values.title || 'New mentor session'),
              preview: String(values.summary || 'No summary yet').slice(0, 28),
              time: 'Now',
              active: true,
            },
            ...sessions.map((session) => ({ ...session, active: false })),
          ]);
          setNewSessionOpen(false);
          appToast.success('Chat session created');
        }}
      />
    </AppShell>
  );
}

function ChatSession({ title, preview, time, active }: { title: string; preview: string; time: string; active?: boolean }) {
  return (
    <button
      className={`w-full p-3 rounded-lg text-left transition-colors ${
        active ? 'bg-[var(--md3-primary-container)]' : 'hover:bg-[var(--md3-surface-variant)]'
      }`}
    >
      <div className="flex items-start gap-2">
        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${active ? 'text-[var(--md3-primary)]' : 'text-[var(--md3-on-surface-variant)]'}`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[var(--md3-on-surface)] truncate">{title}</h4>
          <p className="text-xs text-[var(--md3-on-surface-variant)] truncate">{preview}</p>
        </div>
        <span className="text-xs text-[var(--md3-on-surface-variant)] shrink-0">{time}</span>
      </div>
    </button>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] bg-[var(--md3-primary)] text-white px-4 py-3 rounded-2xl rounded-tr-sm">
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-[var(--md3-primary)]" />
      </div>
      <div className="max-w-[80%] bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <p className="text-sm text-[var(--md3-on-surface)] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

