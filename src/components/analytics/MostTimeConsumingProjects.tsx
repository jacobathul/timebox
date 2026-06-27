import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { ProjectTimeRanking } from '../../lib/analytics/timeAnalytics';
import { formatDuration } from '../../utils/time';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface Props {
  data: ProjectTimeRanking[];
}

export function MostTimeConsumingProjects({ data }: Props) {
  const navigate = useNavigate();
  const visible = data.filter((p) => p.actualMinutes > 0);

  if (visible.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Most Time-Consuming Projects</h3>
        <AnalyticsEmptyState message="No project time tracked in this range." />
      </div>
    );
  }

  const maxMinutes = visible[0]?.actualMinutes ?? 1;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Most Time-Consuming Projects</h3>
      <div className="space-y-3">
        {visible.map((project, i) => (
          <div key={project.projectId ?? 'none'} className="group">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-stone-400 w-4 flex-shrink-0">#{i + 1}</span>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.projectColor ?? '#0ea5e9' }}
              />
              <span className="flex-1 text-sm font-medium text-stone-700 truncate">
                {project.projectName}
              </span>
              {project.projectId && (
                <button
                  onClick={() => navigate(`/app/projects/${project.projectId}`)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-accent-500"
                  title="View project"
                >
                  <ExternalLink size={13} />
                </button>
              )}
              <span className="text-sm font-semibold text-stone-700 flex-shrink-0">
                {formatDuration(project.actualMinutes)}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-400"
                  style={{ width: `${Math.round((project.actualMinutes / maxMinutes) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-stone-400 flex-shrink-0">
                {project.completedTasks}✓ {project.openTasks > 0 ? `${project.openTasks} open` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
