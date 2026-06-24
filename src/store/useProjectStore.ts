import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '../types';
import { generateId } from '../utils/id';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';
import { projectService } from '../services/project.service';

const DEMO_PROJECTS: Project[] = [
  { id: 'proj-work',     name: 'Work',     color: '#0ea5e9' },
  { id: 'proj-personal', name: 'Personal', color: '#10b981' },
  { id: 'proj-learning', name: 'Learning', color: '#8b5cf6' },
];

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}
function toast() {
  return useToastStore.getState();
}

interface ProjectState {
  projects: Project[];
  loading: boolean;

  fetchProjects: () => Promise<void>;
  clearProjects: () => void;
  addProject: (name: string, color: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: DEMO_PROJECTS,
      loading: false,

      fetchProjects: async () => {
        const uid = getUserId();
        if (!uid) return;
        set({ loading: true });
        try {
          const projects = await projectService.fetchAll(uid);
          // If the user has no cloud projects yet, seed them with defaults
          if (projects.length === 0) {
            await Promise.all(DEMO_PROJECTS.map((p) => projectService.create(p, uid)));
            set({ projects: DEMO_PROJECTS });
          } else {
            set({ projects });
          }
        } catch {
          toast().addToast('Failed to load projects', 'error');
        } finally {
          set({ loading: false });
        }
      },

      clearProjects: () => set({ projects: DEMO_PROJECTS }),

      addProject: (name, color) => {
        const project: Project = { id: generateId(), name, color };
        set((s) => ({ projects: [...s.projects, project] }));
        const uid = getUserId();
        if (uid) {
          projectService.create(project, uid).catch(() => {
            set((s) => ({ projects: s.projects.filter((p) => p.id !== project.id) }));
            toast().addToast('Failed to save project', 'error');
          });
        }
        return project;
      },

      updateProject: (id, updates) => {
        const prev = get().projects.find((p) => p.id === id);
        set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...updates } : p) }));
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
            if (prev) set((s) => ({ projects: [...s.projects, prev] }));
            toast().addToast('Failed to delete project', 'error');
          });
        }
      },
    }),
    {
      name: 'flowday-projects',
      partialize: (s) => ({ projects: s.projects }),
    },
  ),
);
