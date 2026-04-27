/**
 * useAutomation - Hook for automation operations
 */

import { useCallback } from 'react';
import { useAppStore } from '../store';
import { AutomationViewModel } from '../features/automation/viewmodels/AutomationViewModel';
import { automationService } from '../features/automation/services/AutomationService';

const viewModel = new AutomationViewModel(automationService);

export const useAutomation = () => {
  const { automations, selectedAutomation, setAutomations, setSelectedAutomation } = useAppStore();

  const loadAutomations = useCallback(async () => {
    try {
      await viewModel.loadAutomations();
      setAutomations(viewModel.getAutomations());
    } catch (error) {
      console.error('Failed to load automations:', error);
    }
  }, [setAutomations]);

  const createAutomation = useCallback(
    async (data: any) => {
      const automation = await viewModel.createAutomation(data);
      setAutomations(viewModel.getAutomations());
      return automation;
    },
    [setAutomations]
  );

  const updateAutomation = useCallback(
    async (id: string, data: any) => {
      const automation = await viewModel.updateAutomation(id, data);
      setAutomations(viewModel.getAutomations());
      return automation;
    },
    [setAutomations]
  );

  const deleteAutomation = useCallback(
    async (id: string) => {
      await viewModel.deleteAutomation(id);
      setAutomations(viewModel.getAutomations());
    },
    [setAutomations]
  );

  const selectAutomation = useCallback(
    (automation: any) => {
      viewModel.selectAutomation(automation);
      setSelectedAutomation(automation);
    },
    [setSelectedAutomation]
  );

  return {
    automations,
    selectedAutomation,
    loadAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    selectAutomation,
  };
};
