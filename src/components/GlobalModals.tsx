import { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useProjectStore } from '../store/useProjectStore';
import { useContextStore } from '../store/useContextStore';
import { useUiStore } from '../store/useUiStore';
import { ProjectFormDialog } from './projects/ProjectFormDialog';
import { ContextFormDialog } from './contexts/ContextFormDialog';
import { ManualTimeEntryDialog } from './ManualTimeEntryDialog';

export function GlobalModals() {
  const tasks = useTaskStore((s) => s.tasks);
  const createProject = useProjectStore((s) => s.createProject);
  const addContext = useContextStore((s) => s.addContext);
  const {
    isProjectModalOpen,
    closeProjectModal,
    isContextModalOpen,
    closeContextModal,
    manualTimeEntryTaskId,
    closeManualTimeEntry,
  } = useUiStore();

  const task = tasks.find((item) => item.id === manualTimeEntryTaskId) ?? null;

  useEffect(() => {
    if (manualTimeEntryTaskId && !task) {
      closeManualTimeEntry();
    }
  }, [closeManualTimeEntry, manualTimeEntryTaskId, task]);

  return (
    <>
      {isProjectModalOpen && (
        <ProjectFormDialog
          onConfirm={(data) => {
            void createProject(data);
          }}
          onClose={closeProjectModal}
        />
      )}

      {isContextModalOpen && (
        <ContextFormDialog
          onConfirm={(name, color) => {
            addContext(name, color, null);
          }}
          onClose={closeContextModal}
        />
      )}

      {task && manualTimeEntryTaskId && (
        <ManualTimeEntryDialog
          taskId={task.id}
          taskTitle={task.title}
          onClose={closeManualTimeEntry}
        />
      )}
    </>
  );
}
