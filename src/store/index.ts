/**
 * Global Zustand Store
 * Manages global state for automations, workflows, executions, and UI
 */

import { create } from 'zustand';
import { AppStore } from './types';

export const useAppStore = create<AppStore>(set => ({
  // Automation state
  automations: [],
  selectedAutomation: null,
  automationLoading: { status: 'idle' },

  // Workflow state
  workflow: null,
  selectedNodeId: null,

  // Execution state
  executions: [],
  metrics: null,

  // UI state
  sidebarOpen: true,
  theme: 'light',
  notification: null,

  // Automation actions
  setAutomations: automations => set({ automations }),
  setSelectedAutomation: selectedAutomation => set({ selectedAutomation }),
  setAutomationLoading: automationLoading => set({ automationLoading }),

  // Workflow actions
  setWorkflow: workflow => set({ workflow }),
  setSelectedNodeId: selectedNodeId => set({ selectedNodeId }),

  // UI actions
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: theme => set({ theme }),
  showNotification: (message, type) => set({ notification: { message, type } }),
  clearNotification: () => set({ notification: null }),
}));

export default useAppStore;
