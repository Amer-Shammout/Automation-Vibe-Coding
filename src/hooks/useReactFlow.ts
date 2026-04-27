/**
 * useReactFlow Hook - Adapter between React Flow and Zustand store
 * Handles event synchronization and state management
 */

import { useCallback } from 'react';
import { useWorkflow } from './useNodeCanvas';
import { IConnection } from '../features/automation/models/Automation';
import { v4 as uuid } from 'uuid';

export const useReactFlow = () => {
  const workflow = useWorkflow();

  /**
   * Handle node drag stop - sync position to store
   */
  const handleNodeDragStop = useCallback(
    (nodeId: string, x: number, y: number) => {
      workflow.updateNodePosition(nodeId, { x, y });
    },
    [workflow]
  );

  /**
   * Handle node connection - create new edge and add to store
   */
  const handleConnect = useCallback(
    (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => {
      // Prevent self-connections
      if (sourceId === targetId) {
        console.warn('Cannot connect node to itself');
        return;
      }

      // Create connection object
      const connection: Omit<IConnection, 'id' | 'createdAt' | 'updatedAt'> = {
        sourceNodeId: sourceId,
        sourcePortId: sourcePort,
        targetNodeId: targetId,
        targetPortId: targetPort,
      };

      // Add connection to workflow
      workflow.addConnection(connection as IConnection);
    },
    [workflow]
  );

  /**
   * Handle edge delete - remove connection from store
   */
  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      workflow.removeConnection(edgeId);
    },
    [workflow]
  );

  /**
   * Handle node delete - remove node and related connections from store
   */
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      workflow.removeNode(nodeId);
    },
    [workflow]
  );

  /**
   * Handle pane click - for future features like adding nodes
   */
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    // Placeholder for future functionality
    // Could be used for adding nodes at clicked position
  }, []);

  return {
    handleNodeDragStop,
    handleConnect,
    handleEdgeDelete,
    handleNodeDelete,
    handlePaneClick,
  };
};
