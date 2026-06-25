import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppProject, AppProjectWithStats, ProjectStatus, Task } from '../types';
import { generateId } from '../utils/id';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';
import { projectService } from '../services/project.service';

function getUserId(): string | null { return useAuthStore.getState().user?.id ?? null; }
function toast() { return useToastStore.getState(); }

export function computeProjectStats(project: AppProject, tasks: Task[]): AppProjectWithStats {
  const allTasks = tasks.filter((t) => t.projectId === project.id);
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const totalTasks = allTasks.length;
  const remainingTasks = totalTasks - completedTasks;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  return { ...project, totalTasks, completedTasks, remainingTasks, progressPercentage };
}

interface ProjectState {
  projects: AppProject[];
  loading: boolean;
  selectedProjectIdsForToday: string[];
  selectedTaskIdsForToday: string[];

  fetchProjects: () => Promise<void>;
  clearProjects: () => void;
  createProject: (data: Pick<AppProject, 'name' | 'description' | 'color' | 'due_date' | 'context_id'>) => Promise<AppProject | null>;
  updateProject: (id: string, updates: Partial<Pick<AppProject, 'name' | 'description' | 'color' | 'due_date' | 'status' | 'context_id' | 'completed_at'>>) => void;
  deleteProject: (id: string) => void;
  markProjectComplete: (id: string) => void;
  archiveProject: (id: string) => void;
  setSelectedProjectsForToday: (ids: string[]) => void;
  setSelectedTasksForToday: (ids: string[]) => void;
  clearDailyPlanningSelection: () => void;
  getProjectWithStats: (id: string, tasks: Task[]) => AppProjectWithStats | undefined;
  getActiveProjects: () => AppProject[];
  getCompletedProjects: () => AppProject[];
  getArchivedProjects: () => AppProject[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      loading: false,
      selectedProjectIdsForToday: [],
      selectedTaskIdsForToday: [],

      fetchProjects: async () => {
        const uid = getUserId();
        if (!uid) return;
        set({ loading: true });
        try {
          const projects = await projectService.fetchAll(uid);
          set({ projects });
        } catch {
          toast().addToast('Failed to load projects', 'error');
        } finally {
          set({ loading: false });
        }
      },

      clearProjects: () => set({ projects: [], selectedProjectIdsForToday: [], selectedTaskIdsForToday: [] }),

      createProject: async (data) => {
        const uid = getUserId();
        if (!uid) return null;
        const tempId = generateId();
        const now = new Date().toISOString();
        const optimistic: AppProject = {
          id: tempId,
          user_id: uid,
          context_id: data.context_id,
          name: data.name.trim(),
          description: data.description,
          color: data.color,
          due_date: data.due_date,
          status: 'active',
          completed_at: null,
          created_at: now,
          updated_at: now,
        };
        set((s) => ({ projects: [optimistic, ...s.projects] }));
        try {
          const saved = await projectService.create({ ...optimistic });
          set((s) => ({
            projects: s.projects.map((p) => p.id === tempId ? saved : p),
          }));
          return saved;
        } catch {
          set((s) => ({ projects: s.projects.filter((p) => p.id !== tempId) }));
          toast().addToast('Failed to create project', 'error');
          return null;
        }
      },

      updateProject: (id, updates) => {
        const prev = get().projects.find((p) => p.id === id);
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
          ),
        }));
        const uid = getUserId();
        if (uid) {
          projectService.update(id, updates, uid).catch(() => {
            if (prev) set((s) => ({ projects: s.projects.map((p) => p.id === id ? prev : p) }));
            toast().addToast('Failed to update project', 'error');
          });
        }
      },

      deleteProject: (id) => {
        const prev = get().projects.find((p) => p.id === id);
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
        const uid = getUserId();
        if (uid) {
          projectService.delete(id, uid).catch(() => {
            if (prev) set((s) => ({ projects: [prev, ...s.projects] }));
            toast().addToast('Failed to delete project', 'error');
          });
        }
      },

      markProjectComplete: (id) => {
        const now = new Date().toISOString();
        get().updateProject(id, { status: 'completed' as ProjectStatus, completed_at: now });
      },

      archiveProject: (id) => {
        get().updateProject(id, { status: 'archived' as ProjectStatus });
      },

      setSelectedProjectsForToday: (ids) => set({ selectedProjectIdsForToday: ids }),
      setSelectedTasksForToday: (ids) => set({ selectedTaskIdsForToday: ids }),
      clearDailyPlanningSelection: () => set({ selectedProjectIdsForToday: [], selectedTaskIdsForToday: [] }),

      getProjectWithStats: (id, tasks) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return undefined;
        return computeProjectStats(project, tasks);
      },
      getActiveProjects: () => get().projects.filter((p) => p.status === 'active'),
      getCompletedProjects: () => get().projects.filter((p) => p.status === 'completed'),
      getArchivedProjects: () => get().projects.filter((p) => p.status === 'archived'),
    }),
    {
      name: 'timebox-projects-v2',
      partialize: (s) => ({
        projects: s.projects,
        selectedProjectIdsForToday: s.selectedProjectIdsForToday,
        selectedTaskIdsForToday: s.selectedTaskIdsForToday,
      }),
    },
  ),
);
