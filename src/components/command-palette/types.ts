import type { ReactNode } from 'react';

export type CommandPaletteGroup =
  | 'Navigation'
  | 'Create'
  | 'Workflows'
  | 'Tasks'
  | 'Projects'
  | 'Contexts'
  | 'Settings';

export type CommandPaletteItem = {
  id: string;
  type: 'command' | 'task' | 'project' | 'context';
  label: string;
  subtitle?: string;
  keywords?: string[];
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  group: CommandPaletteGroup;
  action: () => void | Promise<void>;
};
