import { useState, useRef, useEffect, useMemo } from 'react';
import { AppShell } from '../components/AppShell';
import { ActionButton } from '../components/ActionButton';
import { Skeleton } from '../components/Skeleton';
import { Snackbar } from '../components/Snackbar';
import { LinearProgress } from '../components/LinearProgress';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Check, Pencil, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
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
import type { SendMessageDto, UpdateChatSessionDto } from '@/types/api';

interface ChatSession { id: string; title: string; summary?: string; createdAt: string }
interface ChatMessage { id: string; sender: string; messageContent: string; createdAt: string }

function getApiErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function MentorPage() {
  const user = useAuthStore((s) => s.user);
  const profileId = user?.profileId ?? '';
  const [message, setMessage] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<ChatSession | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'error' });

  // Rename state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData, loading: sessionsLoading, refetch: refetchSessions } = useQuery(GET_CHAT_SESSIONS_BY_PROFILE, {
    variables: { profileId },
    skip: !profileId,
  });

  const [loadMessages, { data: messagesData, loading: messagesLoading }] = useLazyQuery(GET_CHAT_SESSION_WITH_MESSAGES, {
    fetchPolicy: 'network-only',
  });

  const sessions: ChatSession[] = (sessionsData as { chatSessionsByProfile?: ChatSession[] })?.chatSessionsByProfile ?? [];
  const activeSession = (messagesData as { chatSessionWithMessages?: { title?: string; messages?: ChatMessage[] } })?.chatSessionWithMessages;
  const messages: ChatMessage[] = useMemo(() => activeSession?.messages ?? [], [activeSession]);

  // Keep header title in sync with active session
  const activeSessionTitle = activeSession?.title ?? sessions.find((s) => s.id === activeSessionId)?.title ?? '';

  const createSessionMutation = useMutation({
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
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

  const renameSessionMutation = useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) => {
      const dto: UpdateChatSessionDto = { title };
      return apiClient.put<ChatSession>(`/api/chat/sessions/${sessionId}`, dto).then((r) => r.data);
    },
    onSuccess: async () => {
      await refetchSessions();
      // If renaming the active session, reload its messages to get updated title
      if (activeSessionId) {
        loadMessages({ variables: { sessionId: activeSessionId } });
      }
      setEditingSessionId(null);
      setIsEditingHeader(false);
      setSnackbar({ open: true, message: 'Session renamed.', variant: 'success' });
    },
    onError: (error: unknown) => {
      setSnackbar({ open: true, message: getApiErrorMessage(error, 'Failed to rename session.'), variant: 'error' });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/api/chat/sessions/${sessionId}`),
    onSuccess: async (_data, sessionId) => {
      await refetchSessions();
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setPendingUserMessage(null);
        setMessage('');
      }
      if (editingSessionId === sessionId) setEditingSessionId(null);
      setDeletingSession(null);
      setIsEditingHeader(false);
      setSnackbar({ open: true, message: 'Session deleted.', variant: 'success' });
    },
    onError: (error: unknown) => {
      setSnackbar({ open: true, message: getApiErrorMessage(error, 'Failed to delete session.'), variant: 'error' });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, dto }: { sessionId: string; dto: SendMessageDto }) =>
      apiClient.post(`/api/chat/sessions/${sessionId}/messages`, dto).then((r) => r.data),
    onSuccess: async (_data, { sessionId }) => {
      await loadMessages({ variables: { sessionId } });
      setPendingUserMessage(null);
    },
    onError: (error: unknown, { dto }) => {
      setPendingUserMessage(null);
      setMessage(dto.messageContent);
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send message.';
      setSnackbar({ open: true, message: msg, variant: 'error' });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingUserMessage, sendMessageMutation.isPending]);

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  useEffect(() => {
    if (isEditingHeader && headerInputRef.current) {
      headerInputRef.current.focus();
      headerInputRef.current.select();
    }
  }, [isEditingHeader]);

  const handleSend = () => {
    if (!message.trim() || !activeSessionId) return;
    const content = message.trim();
    const dto: SendMessageDto = { sender: 'User', messageContent: content };
    setPendingUserMessage(content);
    setMessage('');
    sendMessageMutation.mutate({ sessionId: activeSessionId, dto });
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setEditingSessionId(null);
    setIsEditingHeader(false);
    loadMessages({ variables: { sessionId } });
  };

  const handleNewSession = () => {
    const title = `Session ${new Date().toLocaleDateString()}`;
    createSessionMutation.mutate({ profileId, title });
  };

  const startSidebarEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const commitSidebarEdit = (sessionId: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) { setEditingSessionId(null); return; }
    renameSessionMutation.mutate({ sessionId, title: trimmed });
  };

  const startHeaderEdit = () => {
    setHeaderTitle(activeSessionTitle);
    setIsEditingHeader(true);
  };

  const commitHeaderEdit = () => {
    if (!activeSessionId) return;
    const trimmed = headerTitle.trim();
    if (!trimmed) { setIsEditingHeader(false); return; }
    renameSessionMutation.mutate({ sessionId: activeSessionId, title: trimmed });
  };

  const handleDeleteSession = (session: ChatSession) => {
    setDeletingSession(session);
  };

  const confirmDeleteSession = () => {
    if (!deletingSession) return;
    deleteSessionMutation.mutate(deletingSession.id);
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
              sessions.map((session) =>
                editingSessionId === session.id ? (
                  /* Inline rename input */
                  <div key={session.id} className="flex items-center gap-1 px-2 py-1.5">
                    <input
                      ref={editInputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitSidebarEdit(session.id);
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      className="flex-1 min-w-0 text-sm px-2 py-1.5 rounded-lg border border-[var(--md3-primary)] focus:outline-none text-[var(--md3-on-surface)]"
                    />
                    <button
                      onClick={() => commitSidebarEdit(session.id)}
                      disabled={renameSessionMutation.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--md3-primary-container)] text-[var(--md3-primary)] disabled:opacity-40"
                      aria-label="Confirm rename"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingSessionId(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)]"
                      aria-label="Cancel rename"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Normal session row */
                  <div key={session.id} className="group relative flex items-center">
                    <button
                      onClick={() => handleSelectSession(session.id)}
                      className={`flex-1 min-w-0 p-3 pr-9 rounded-lg text-left transition-colors ${activeSessionId === session.id ? 'bg-[var(--md3-primary-container)]' : 'hover:bg-[var(--md3-surface-variant)]'}`}
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${activeSessionId === session.id ? 'text-[var(--md3-primary)]' : 'text-[var(--md3-on-surface-variant)]'}`} />
                        <h4 className="text-sm font-medium text-[var(--md3-on-surface)] truncate">{session.title}</h4>
                      </div>
                    </button>
                    <button
                      onClick={(e) => startSidebarEdit(session, e)}
                      className="absolute right-8 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)] transition-opacity"
                      aria-label={`Rename "${session.title}"`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session);
                      }}
                      disabled={deleteSessionMutation.isPending}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-600 transition-opacity disabled:opacity-40"
                      aria-label={`Delete "${session.title}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              )
            )}
          </div>
        </aside>

        {/* Chat main area */}
        <div className="flex-1 flex flex-col bg-[var(--md3-surface-container)]">
          <div className="h-16 bg-white border-b border-[var(--md3-outline-variant)] px-5 flex items-center gap-3">
            {isEditingHeader && activeSessionId ? (
              <>
                <input
                  ref={headerInputRef}
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitHeaderEdit();
                    if (e.key === 'Escape') setIsEditingHeader(false);
                  }}
                  className="flex-1 text-base font-medium px-3 py-1.5 rounded-lg border border-[var(--md3-primary)] focus:outline-none text-[var(--md3-on-surface)] bg-white"
                />
                <button
                  onClick={commitHeaderEdit}
                  disabled={renameSessionMutation.isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md3-primary-container)] text-[var(--md3-primary)] disabled:opacity-40"
                  aria-label="Confirm rename"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingHeader(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)]"
                  aria-label="Cancel rename"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-medium text-[var(--md3-on-surface)] flex-1 truncate">
                  {activeSessionTitle || 'Select or create a session'}
                </h3>
                {activeSessionId && (
                  <>
                    <button
                      onClick={startHeaderEdit}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md3-surface-variant)] text-[var(--md3-on-surface-variant)] transition-colors"
                      aria-label="Rename session"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const session = sessions.find((item) => item.id === activeSessionId);
                        if (session) handleDeleteSession(session);
                      }}
                      disabled={deleteSessionMutation.isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors disabled:opacity-40"
                      aria-label="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            )}
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
            {pendingUserMessage && (
              <div className="flex justify-end">
                <div className="max-w-[70%] bg-[var(--md3-primary)] text-white px-4 py-3 rounded-2xl rounded-tr-sm opacity-70">
                  <p className="text-sm">{pendingUserMessage}</p>
                </div>
              </div>
            )}
            {sendMessageMutation.isPending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--md3-primary-container)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--md3-primary)]" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--md3-on-surface-variant)] animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--md3-on-surface-variant)] animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--md3-on-surface-variant)] animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
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
                placeholder={
                  !activeSessionId
                    ? 'Create a session first...'
                    : sendMessageMutation.isPending
                      ? 'AI Mentor is thinking...'
                      : 'Ask your AI Mentor...'
                }
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

      <ConfirmDialog
        isOpen={deletingSession !== null}
        title="Delete Chat Session?"
        message={`This will permanently remove "${deletingSession?.title ?? 'this chat session'}" and its chat history.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteSession}
        onCancel={() => setDeletingSession(null)}
      />

      <Snackbar isOpen={snackbar.open} message={snackbar.message} variant={snackbar.variant} onClose={() => setSnackbar({ open: false, message: '', variant: 'error' })} />
    </AppShell>
  );
}
