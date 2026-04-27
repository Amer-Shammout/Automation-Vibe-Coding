/**
 * Global store types
 */

import { IAutomation, IWorkflow } from '../features/automation/models/types';
import { IExecution } from '../features/execution/models';
import { AsyncState } from '../types/common';

export interface AutomationState {
  automations: IAutomation[];
  selectedAutomation: IAutomation | null;
  automationLoading: AsyncState<IAutomation[]>;
}

export interface WorkflowState {
  workflow: IWorkflow | null;
  selectedNodeId: string | null;
}

export interface ExecutionState {
  executions: IExecution[];
  metrics: any | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notification: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;
}

export interface AppStore extends AutomationState, WorkflowState, ExecutionState, UIState {
  // Automation actions
  setAutomations: (automations: IAutomation[]) => void;
  setSelectedAutomation: (automation: IAutomation | null) => void;
  setAutomationLoading: (loading: AsyncState<IAutomation[]>) => void;

  // Workflow actions
  setWorkflow: (workflow: IWorkflow | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;

  // UI actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  clearNotification: () => void;
}
