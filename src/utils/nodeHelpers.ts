/**
 * Node-related helper utilities
 */

import { INode, IConnection, IWorkflow } from '../features/automation/models/types';
import { v4 as uuidv4 } from 'uuid';

export const nodeHelpers = {
  generateNodeId: (): string => {
    return `node_${uuidv4()}`;
  },

  generateConnectionId: (): string => {
    return `conn_${uuidv4()}`;
  },

  createNode: (type: string, name: string, position: { x: number; y: number }): INode => {
    return {
      id: nodeHelpers.generateNodeId(),
      name,
      type,
      inputs: [],
      outputs: [],
      config: {},
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  createConnection: (
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): IConnection => {
    return {
      id: nodeHelpers.generateConnectionId(),
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  findNodeById: (workflow: IWorkflow, nodeId: string): INode | undefined => {
    return workflow.nodes.find((n: any) => n.id === nodeId);
  },

  findConnectionById: (workflow: IWorkflow, connectionId: string): IConnection | undefined => {
    return workflow.connections.find((c: any) => c.id === connectionId);
  },

  getConnectedNodes: (workflow: IWorkflow, nodeId: string): INode[] => {
    const connectedIds = new Set<string>();

    // Find all connections where this node is source or target
    workflow.connections.forEach((conn: any) => {
      if (conn.sourceNodeId === nodeId) {
        connectedIds.add(conn.targetNodeId);
      }
      if (conn.targetNodeId === nodeId) {
        connectedIds.add(conn.sourceNodeId);
      }
    });

    return workflow.nodes.filter((n: any) => connectedIds.has(n.id));
  },

  validateNodeConnection: (sourceNode: INode, targetNode: INode): boolean => {
    // Basic validation - prevent self-connections
    if (sourceNode.id === targetNode.id) {
      return false;
    }
    return true;
  },
};
