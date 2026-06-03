import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router';
import {
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  LogIn,
  ArrowRight,
  Rocket,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  GET_CAREER_ROADMAP_WITH_NODES,
  GET_LEARNING_RESOURCES_BY_NODE,
  GET_PERSONAL_ROADMAPS_BY_PROFILE,
} from '@/graphql/queries';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '../../components/AppShell';
import { PublicLayout } from '../../components/PublicLayout';
import { Skeleton } from '../../components/Skeleton';
import { ActionButton, ActionLink } from '../../components/ActionButton';
import { Snackbar } from '../../components/Snackbar';
import { apiClient } from '@/lib/axios';
import { apolloClient } from '@/lib/apollo';
import type {
  CareerRoadmapWithNodesDto,
  LearningResourceDto,
  NodeDto,
} from '@/types/api';
import { useCatalogRoutes } from './catalogRoutes';

interface TreeNode extends NodeDto {
  children: TreeNode[];
}

function buildTree(nodes: NodeDto[]): TreeNode[] {
  const map = new globalThis.Map<string, TreeNode>(
    nodes.map((n) => [n.id, { ...n, children: [] }]),
  );
  const roots: TreeNode[] = [];

  for (const n of nodes) {
    const node = map.get(n.id)!;
    if (n.parentNodeId && map.has(n.parentNodeId)) {
      map.get(n.parentNodeId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (ns: TreeNode[]) => {
    ns.sort((a, b) => a.order - b.order);
    ns.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

function NodeResources({ nodeId }: { nodeId: string }) {
  const { data, loading, error } = useQuery(GET_LEARNING_RESOURCES_BY_NODE, {
    variables: { nodeId },
  });
  const resources: LearningResourceDto[] =
    (data as { learningResourcesByNode?: LearningResourceDto[] })?.learningResourcesByNode ?? [];

  if (loading) {
    return (
      <div className="ml-8 mt-1 space-y-2">
        <Skeleton className="h-10 rounded-lg" />
      </div>
    );
  }

  if (error || resources.length === 0) return null;

  return (
    <div className="ml-8 mt-1 mb-2 space-y-2">
      {resources.map((resource) => (
        <a
          key={resource.id}
          href={resource.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-[var(--md3-outline-variant)] bg-white px-3 py-2 text-xs transition-colors hover:border-[var(--md3-primary)]"
        >
          <BookOpen className="h-4 w-4 shrink-0 text-[var(--md3-primary)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[var(--md3-on-surface)]">
              {resource.name}
            </p>
            <p className="truncate text-[var(--md3-on-surface-variant)]">
              {resource.resourceType}
              {resource.provider ? ` - ${resource.provider}` : ''}
              {resource.isFree ? ' - Free' : ' - Paid'}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)]" />
        </a>
      ))}
    </div>
  );
}

function NodeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const showResources = open || !hasChildren;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && setOpen((v) => !v)}
        className={`flex items-start gap-2 py-2 w-full text-left rounded-lg transition-colors ${
          hasChildren
            ? 'hover:bg-[var(--md3-surface-variant)] cursor-pointer'
            : 'cursor-default'
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px`, paddingRight: '12px' }}
      >
        {hasChildren ? (
          <ChevronRight
            className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--md3-on-surface-variant)] transition-transform ${
              open ? 'rotate-90' : ''
            }`}
          />
        ) : (
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--md3-primary)] ml-1 mr-0.5" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--md3-on-surface)]">{node.name}</p>
          {node.description && (
            <p className="text-xs text-[var(--md3-on-surface-variant)] mt-0.5">{node.description}</p>
          )}
        </div>
        {hasChildren && (
          <span className="ml-auto text-xs text-[var(--md3-on-surface-variant)] shrink-0 pt-0.5">
            {node.children.length}
          </span>
        )}
      </button>
      {showResources && <NodeResources nodeId={node.id} />}
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <NodeRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CareerRoadmapDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paths = useCatalogRoutes();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const { data, loading, error } = useQuery(GET_CAREER_ROADMAP_WITH_NODES, {
    variables: { roadmapId: id },
    skip: !id,
  });
  const roadmap: CareerRoadmapWithNodesDto | null =
    (data as { careerRoadmapWithNodes?: CareerRoadmapWithNodesDto })
      ?.careerRoadmapWithNodes ?? null;

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient
        .post<{ id: string }>('/api/personal-roadmaps/generate', {
          profileId: user?.profileId,
          careerRoadmapId: id,
        })
        .then((r) => r.data),
    onSuccess: async (result) => {
      await apolloClient.refetchQueries({ include: [GET_PERSONAL_ROADMAPS_BY_PROFILE] });
      navigate(`/roadmap/${result.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to generate roadmap.';
      setSnackbar({ open: true, message: msg });
    },
  });

  const backPath = roadmap?.careerRoleId
    ? paths.roleDetailPath(roadmap.careerRoleId)
    : paths.roleListPath;

  const tree = roadmap ? buildTree(roadmap.nodes) : [];

  const content = (
    <>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-4 w-full max-w-lg rounded" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <AlertCircle className="h-10 w-10 text-[var(--md3-error)] mx-auto mb-3" />
          <p className="text-[var(--md3-on-surface-variant)]">
            Failed to load roadmap template.
          </p>
        </div>
      ) : roadmap ? (
        <>
          <div className="mb-4">
            <Link
              to={backPath}
              className="inline-flex items-center gap-1 text-sm text-[var(--md3-primary)] hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--md3-primary-container)]">
                <MapIcon className="h-6 w-6 text-[var(--md3-primary)]" />
              </div>
              <div>
                <h1
                  className={
                    isAuthenticated
                      ? 'app-page-title'
                      : 'text-2xl font-bold text-[var(--md3-on-surface)]'
                  }
                >
                  {roadmap.name}
                </h1>
                {roadmap.isCustom && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--md3-primary-container)] text-[var(--md3-primary)]">
                    <Sparkles className="h-3 w-3" />
                    Custom Template
                  </span>
                )}
              </div>
            </div>
            {roadmap.description && (
              <p
                className={
                  isAuthenticated
                    ? 'app-page-subtitle'
                    : 'text-[var(--md3-on-surface-variant)] mt-2'
                }
              >
                {roadmap.description}
              </p>
            )}
          </div>

          <div className="md3-card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-[var(--md3-primary)]" />
              <h2 className="text-base font-semibold text-[var(--md3-on-surface)]">
                Learning Path
              </h2>
              <span className="text-xs text-[var(--md3-on-surface-variant)] ml-auto">
                {roadmap.nodes.length} topics
              </span>
            </div>
            {tree.length > 0 ? (
              <div>
                {tree.map((node) => (
                  <NodeRow key={node.id} node={node} depth={0} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--md3-on-surface-variant)] py-4 text-center">
                No topics defined yet.
              </p>
            )}
          </div>

          {isAuthenticated ? (
            <div className="md3-panel p-6 text-center">
              <Rocket className="h-10 w-10 text-[var(--md3-primary)] mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-[var(--md3-on-surface)] mb-2">
                Ready to start?
              </h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
                Generate your personalized roadmap and track your progress step by step.
              </p>
              <ActionButton
                icon={Rocket}
                label={generateMutation.isPending ? 'Generating...' : 'Generate My Roadmap'}
                variant="primary"
                size="lg"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !user?.profileId}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--md3-outline-variant)] bg-[var(--md3-surface-container,#f4f4f4)] p-6 text-center">
              <LogIn className="h-10 w-10 text-[var(--md3-primary)] mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-[var(--md3-on-surface)] mb-2">
                Start your journey
              </h2>
              <p className="text-sm text-[var(--md3-on-surface-variant)] mb-4">
                Sign in or create a free account to generate your personalized roadmap and track
                your progress.
              </p>
              <div className="flex justify-center gap-3">
                <ActionLink icon={LogIn} label="Sign in" to="/login" variant="tonal" size="md" />
                <ActionLink
                  icon={ArrowRight}
                  label="Create account"
                  to="/register"
                  variant="primary"
                  size="md"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <AlertCircle className="h-10 w-10 text-[var(--md3-error)] mx-auto mb-3" />
          <p className="text-[var(--md3-on-surface-variant)]">Roadmap template not found.</p>
        </div>
      )}

      <Snackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        variant="error"
        onClose={() => setSnackbar({ open: false, message: '' })}
      />
    </>
  );

  if (paths.isProtectedCatalog) {
    return (
      <AppShell breadcrumb="Roadmap Template">
        <div className="app-page">{content}</div>
      </AppShell>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">{content}</div>
    </PublicLayout>
  );
}
