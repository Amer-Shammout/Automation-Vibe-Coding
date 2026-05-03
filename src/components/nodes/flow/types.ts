/**
 * React Flow Type Definitions
 * Wraps existing INode/IConnection models for React Flow compatibility
 */

import { Node, Edge } from 'reactflow';
import { INode, IConnection, INodePort } from '../../../features/automation/models/Automation';

export interface INodeData {
  label: string;
  type: string;
  inputs: INodePort[];
  outputs: INodePort[];
  config: Record<string, unknown>;
  onUpdateConfig?: (patch: Record<string, unknown>) => void;
  onDelete?: () => void;
}

export type IFlowNode = Node<INodeData>;
export type IFlowEdge = Edge;

interface NodeToFlowNodeOptions {
  onUpdateConfig?: (patch: Record<string, unknown>) => void;
  onDelete?: () => void;
}

/**
 * Convert INode model to React Flow node
 */
export const nodeToFlowNode = (node: INode, options?: NodeToFlowNodeOptions): IFlowNode => ({
  id: node.id,
  data: {
    label: node.name,
    type: node.type,
    inputs: node.inputs,
    outputs: node.outputs,
    config: node.config as Record<string, unknown>,
    onUpdateConfig: options?.onUpdateConfig,
    onDelete: options?.onDelete,
  },
  position: {
    x: node.position.x,
    y: node.position.y,
  },
  type: 'customNode',
});

/**
 * Convert React Flow node back to INode (position sync)
 */
export const flowNodeToNode = (flowNode: IFlowNode, original: INode): INode => ({
  ...original,
  position: {
    x: flowNode.position.x,
    y: flowNode.position.y,
  },
});

/**
 * Convert IConnection model to React Flow edge
 */
export const connectionToFlowEdge = (connection: IConnection): IFlowEdge => ({
  id: connection.id,
  source: connection.sourceNodeId,
  target: connection.targetNodeId,
  sourceHandle: `output-${connection.sourcePortId}`,
  targetHandle: `input-${connection.targetPortId}`,
  type: 'customEdge',
  updatable: true,
});

/**
 * Convert React Flow connection to IConnection model
 */
export const flowConnectionToConnection = (
  sourceId: string,
  sourcePortId: string,
  targetId: string,
  targetPortId: string
): Omit<IConnection, 'id' | 'createdAt' | 'updatedAt'> => ({
  sourceNodeId: sourceId,
  sourcePortId: sourcePortId,
  targetNodeId: targetId,
  targetPortId: targetPortId,
});
