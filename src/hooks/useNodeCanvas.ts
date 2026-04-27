/**
 * useWorkflow - Hook for workflow/node canvas operations
 */

import { useCallback } from 'react';
import { useAppStore } from '../store';
import { WorkflowViewModel } from '../features/automation/viewmodels/WorkflowViewModel';
import { workflowService } from '../features/automation/services/WorkflowService';
import { INode, IConnection, IPosition } from '../features/automation/models/types';

const viewModel = new WorkflowViewModel(workflowService);

export const useWorkflow = () => {
  const { workflow, selectedNodeId, setWorkflow, setSelectedNodeId } = useAppStore();

  const loadWorkflow = useCallback(
    async (workflowId: string) => {
      const loaded = await viewModel.loadWorkflow(workflowId);
      setWorkflow(loaded);
      return loaded;
    },
    [setWorkflow]
  );

  const addNode = useCallback(
    (node: INode) => {
      viewModel.addNode(node);
      setWorkflow(viewModel.getWorkflow());
    },
    [setWorkflow]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      viewModel.removeNode(nodeId);
      setWorkflow(viewModel.getWorkflow());
    },
    [setWorkflow]
  );

  const updateNodePosition = useCallback(
    (nodeId: string, position: IPosition) => {
      viewModel.updateNodePosition(nodeId, position);
      setWorkflow(viewModel.getWorkflow());
    },
    [setWorkflow]
  );

  const addConnection = useCallback(
    (connection: IConnection) => {
      viewModel.addConnection(connection);
      setWorkflow(viewModel.getWorkflow());
    },
    [setWorkflow]
  );

  const removeConnection = useCallback(
    (connectionId: string) => {
      viewModel.removeConnection(connectionId);
      setWorkflow(viewModel.getWorkflow());
    },
    [setWorkflow]
  );

  const saveWorkflow = useCallback(async () => {
    await viewModel.saveWorkflow();
  }, []);

  const selectNode = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
    },
    [setSelectedNodeId]
  );

  return {
    workflow,
    selectedNodeId,
    loadWorkflow,
    addNode,
    removeNode,
    updateNodePosition,
    addConnection,
    removeConnection,
    saveWorkflow,
    selectNode,
  };
};
