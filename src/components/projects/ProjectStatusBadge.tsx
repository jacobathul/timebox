import type { ProjectStatus } from '../../types';

const STYLES: Record<ProjectStatus, string> = {
  active:    'bg-blue-50 text-blue-600 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  archived:  'bg-stone-100 text-stone-500 border-stone-200',
};

const LABELS: Record<ProjectStatus, string> = {
  active: 'Active', completed: 'Completed', archived: 'Archived',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
