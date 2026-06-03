import { useState, useRef, useEffect } from 'react';
import { AppShell } from '../components/AppShell';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { LinearProgress } from '../components/LinearProgress';
import { Plus, Send, Sparkles } from 'lucide-react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  GET_CHAT_SESSIONS_BY_PROFILE,
  GET_CHAT_SESSION_WITH_MESSAGES,
} from '@/graphql/queries';
import type { SendMessageDto } from '@/types/api';

interface ChatSession { id: string; title: string; summary?: string; createdAt: string }
interface ChatMessage { id: string; sender: string; messageContent: string; createdAt: string }

export function MentorPage() {
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';
  const [message, setMessage] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData, loading: sessionsLoading, refetch: refetchSessions } = useQuery(GET_CHAT_SESSIONS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const [loadMessages, { data: messagesData, loading: messagesLoading }] = useLazyQuery(GET_CHAT_SESSION_WITH_MESSAGES);

  const sessions: ChatSession[] = (sessionsData as any)?.chatSessionsByProfile ?? [];
  const activeSession = (messagesData as any)?.chatSessionWithMessages;
  const messages: ChatMessage[] = activeSession?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSessionMutation = useMutation({
    // Backend: POST /api/chat/sessions?profileId=... with body { title }
    mutationFn: ({ profileId: pid, title }: { profileId: string; title: string }) =>
      apiClient
        .post<{ id: string; title: string; profileId: string; createdAt: string }>(
          '/api/chat/sessions',
          { title },
          { params: { profileId: pid } },
        )
        .then((r) => r.data),
    onSuccess: async (data) => {
      await refetchSessions();
      setActiveSessionId(data.id);
      loadMessages({ variables: { sessionId: data.id } });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create session.';
      setSnackbar({ open: true, message: msg });
    },
  });

  const sendMessageMutation = useMutation({
    // Backend SendMessageDto: { Sender, MessageContent }
    mutationFn: ({ sessionId, dto }: { sessionId: string; dto: SendMessageDto }) =>
      apiClient.post(`/api/chat/sessions/${sessionId}/messages`, dto).then((r) => r.data),
    onSuccess: async (_data, { sessionId }) => {
      await loadMessages({ variables: { sessionId } });
      setMessage('');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send message.';
      setSnackbar({ open: true, message: msg });
    },
  });

  const handleSend = () => {
    if (!message.trim() || !activeSessionId) return;
    const dto: SendMessageDto = { sender: 'User', messageContent: message.trim() };
    sendMessageMutation.mutate({ sessionId: activeSessionId, dto });
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    loadMessages({ variables: { sessionId } });
  };

  const handleNewSession = () => {
    const title = `Session ${new Date().toLocaleDateString()}`;
    createSessionMutation.mutate({ profileId, title });
  };

  return (
    <AppShell breadcrumb="AI Mentor" className="app-main--flush">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Session sidebar */}
        <aside className="hidden w-[280px] flex-col border-r border-[var(--md3-outline-variant)] bg-white lg:flex">
          <div className="p-4 border-b border-[var(--md3-outline-variant)] flex items-center justify-between">
            <h2 className="text-base font-medium text-[var(--md3-on-surface)]">AI Mentor</h2>
            <ActionButton icon={Plus} label="New" onClick={handleNewSession} disabled={createSessionMutation.isPending} />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sessionsLoading ? (
              <div className="space-y-2 p-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-[var(--md3-on-surface-variant)] p-4 text-center">No sessions yet</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${activeSessionId === session.id ? 'bg-[var(--md3-primary-container)]' : 'hover:bg-[var(--md3-surface-variant)]'}`}
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${activeSessionId === session.id ? 'text-[var(--md3-primary)]' : 'text-[var(--md3-on-surface-variant)]'}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[var(--md3-on-surface)] truncate">{session.title}</h4>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat main area */}
        <div className="flex-1 flex flex-col bg-[var(--md3-surface-container)]">
          <div className="h-16 bg-white border-b border-[var(--md3-outline-variant)] px-5 flex items-center">
            <h3 className="text-base font-medium text-[var(--md3-on-surface)]">
              {activeSession?.title ?? 'Select or create a session'}
            </h3>
          </div>

          {sendMessageMutation.isPending && <LinearProgress value={0} heightClassName="h-1" />}

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!activeSessionId && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-[var(--md3-on-surface-variant)]">Select a session or create a new one to start chatting.</p>
              </div>
            )}
            {messagesLoading && (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            )}
            {messages.map((msg) =>
              msg.sender === 'User' || msg.sender === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[70%] bg-[var(--md3-primary)] text-white px-4 py-3 rounded-2xl rounded-tr-sm">
                    <p className="text-sm">{msg.messageContent}</p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[var(--md3-primary)]" />
                  </div>
                  <div className="max-w-[80%] bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm prose prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.messageContent}</ReactMarkdown>
                  </div>
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-[var(--md3-outline-variant)] p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={activeSessionId ? 'Ask your AI Mentor...' : 'Create a session first...'}
                disabled={!activeSessionId || sendMessageMutation.isPending}
                className="flex-1 h-12 px-4 bg-white border-2 border-[var(--md3-outline)] rounded-full focus:border-[var(--md3-primary)] focus:outline-none disabled:opacity-50"
              />
              <ActionButton
                icon={Send}
                label="Send"
                variant="primary"
                size="md"
                disabled={!message.trim() || !activeSessionId || sendMessageMutation.isPending}
                className="h-12"
                onClick={handleSend}
              />
            </div>
          </div>
        </div>
      </div>

      <Snackbar isOpen={snackbar.open} message={snackbar.message} variant="error" onClose={() => setSnackbar({ open: false, message: '' })} />
    </AppShell>
  );
}
