import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectContext, ContextTreeNode } from '../types';
import { generateId } from '../utils/id';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';
import { contextService } from '../services/context.service';

export const MAX_DEPTH = 5;

export const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6',
  '#ec4899', '#6b7280',
];

const DEFAULT_CONTEXTS: ProjectContext[] = [
  { id: 'ctx-work',     user_id: '', parent_context_id: null, name: 'Work',     color: '#3b82f6', depth: 1, created_at: '', updated_at: '' },
  { id: 'ctx-personal', user_id: '', parent_context_id: null, name: 'Personal', color: '#22c55e', depth: 1, created_at: '', updated_at: '' },
];

function getUserId(): string | null { return useAuthStore.getState().user?.id ?? null; }
function toast() { return useToastStore.getState(); }

// Build a tree from a flat list
export function buildContextTree(contexts: ProjectContext[]): ContextTreeNode[] {
  const map = new Map<string, ContextTreeNode>();
  contexts.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: ContextTreeNode[] = [];
  map.forEach((node) => {
    if (node.parent_context_id && map.has(node.parent_context_id)) {
      map.get(node.parent_context_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Sort children by name at each level
  function sortChildren(nodes: ContextTreeNode[]) {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortChildren(n.children));
  }
  sortChildren(roots);
  return roots;
}

// Flatten tree to ordered list with full path info (for selector)
export interface FlatContext extends ProjectContext {
  path: string;        // "Work / Ciena / Sprint Planning"
  indent: number;      // 0-based depth indent
}

export function flattenContextTree(tree: ContextTreeNode[], parentPath = ''): FlatContext[] {
  const result: FlatContext[] = [];
  tree.forEach((node) => {
    const path = parentPath ? `${parentPath} / ${node.name}` : node.name;
    result.push({ ...node, path, indent: node.depth - 1 });
    result.push(...flattenContextTree(node.children, path));
  });
  return result;
}

// Get depth of a context by walking up the tree
export function getContextDepth(contextId: string, contexts: ProjectContext[]): number {
  let depth = 0;
  let current: ProjectContext | undefined = contexts.find((c) => c.id === contextId);
  while (current) {
    depth++;
    current = current.parent_context_id ? contexts.find((c) => c.id === current!.parent_context_id) : undefined;
  }
  return depth;
}

interface ContextState {
  contexts: ProjectContext[];
  loading: boolean;
  fetchContexts: () => Promise<void>;
  clearContexts: () => void;
  addContext: (name: string, color: string, parentId?: string | null) => ProjectContext | null;
  updateContext: (id: string, updates: Partial<Pick<ProjectContext, 'name' | 'color'>>) => void;
  deleteContext: (id: string) => void;
  // Derived helpers (not persisted)
  getTree: () => ContextTreeNode[];
  getFlat: () => FlatContext[];
  getById: (id: string) => ProjectContext | undefined;
  getPath: (id: string) => string;
  getChildCount: (id: string) => number;
  getTaskCount: (id: string, tasks: { contextId: string | null }[]) => number;
}

export const useContextStore = create<ContextState>()(
  persist(
    (set, get) => ({
      contexts: DEFAULT_CONTEXTS,
      loading: false,

      fetchContexts: async () => {
        const uid = getUserId();
        if (!uid) return;
        set({ loading: true });
        try {
          let contexts = await contextService.fetchAll(uid);
          if (contexts.length === 0) {
            // Seed default contexts for new users
            const seeded = await Promise.all(
              DEFAULT_CONTEXTS.map((c) =>
                contextService.create({ ...c, id: generateId(), user_id: uid })
              )
            );
            contexts = seeded;
          }
          set({ contexts });
        } catch {
          toast().addToast('Failed to load contexts', 'error');
        } finally {
          set({ loading: false });
        }
      },

      clearContexts: () => set({ contexts: DEFAULT_CONTEXTS }),

      addContext: (name, color, parentId = null) => {
        const uid = getUserId();
        const contexts = get().contexts;
        // Compute depth
        const parentDepth = parentId ? (contexts.find((c) => c.id === parentId)?.depth ?? 0) : 0;
        const depth = parentDepth + 1;
        if (depth > MAX_DEPTH) {
          toast().addToast(`Cannot nest contexts deeper than ${MAX_DEPTH} levels`, 'warning');
          return null;
        }
        // Duplicate sibling check
        const siblings = contexts.filter((c) => c.parent_context_id === (parentId ?? null));
        if (siblings.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
          toast().addToast('A context with that name already exists here', 'warning');
          return null;
        }
        const ctx: ProjectContext = {
          id: generateId(),
          user_id: uid ?? '',
          parent_context_id: parentId ?? null,
          name: name.trim(),
          color,
          depth,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((s) => ({ contexts: [...s.contexts, ctx] }));
        if (uid) {
          contextService.create(ctx).catch(() => {
            set((s) => ({ contexts: s.contexts.filter((c) => c.id !== ctx.id) }));
            toast().addToast('Failed to save context', 'error');
          });
        }
        return ctx;
      },

      updateContext: (id, updates) => {
        const prev = get().contexts.find((c) => c.id === id);
        set((s) => ({
          contexts: s.contexts.map((c) => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c),
        }));
        const uid = getUserId();
        if (uid) {
          contextService.update(id, updates, uid).catch(() => {
            if (prev) set((s) => ({ contexts: s.contexts.map((c) => c.id === id ? prev : c) }));
            toast().addToast('Failed to update context', 'error');
          });
        }
      },

      deleteContext: (id) => {
        const prev = get().contexts.find((c) => c.id === id);
        // Remove the context and all its descendants
        const toDelete = new Set<string>();
        function collectDescendants(cid: string) {
          toDelete.add(cid);
          get().contexts.filter((c) => c.parent_context_id === cid).forEach((c) => collectDescendants(c.id));
        }
        collectDescendants(id);
        set((s) => ({ contexts: s.contexts.filter((c) => !toDelete.has(c.id)) }));
        const uid = getUserId();
        if (uid) {
          contextService.delete(id, uid).catch(() => {
            if (prev) set((s) => ({ contexts: [...s.contexts, prev] }));
            toast().addToast('Failed to delete context', 'error');
          });
        }
      },

      getTree: () => buildContextTree(get().contexts),
      getFlat: () => flattenContextTree(buildContextTree(get().contexts)),
      getById: (id) => get().contexts.find((c) => c.id === id),
      getPath: (id) => {
        const flat = flattenContextTree(buildContextTree(get().contexts));
        return flat.find((c) => c.id === id)?.path ?? '';
      },
      getChildCount: (id) => get().contexts.filter((c) => c.parent_context_id === id).length,
      getTaskCount: (id, tasks) => tasks.filter((t) => t.contextId === id).length,
    }),
    {
      name: 'timebox-contexts',
      partialize: (s) => ({ contexts: s.contexts }),
    },
  ),
);
