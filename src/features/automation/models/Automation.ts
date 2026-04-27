/**
 * Core automation models and types
 */

import { IEntity } from '../../../types/common';

export interface INode extends IEntity {
  name: string;
  type: string;
  inputs: INodePort[];
  outputs: INodePort[];
  config: Record<string, any>;
  position: IPosition;
}

export interface INodePort {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition' | 'data';
  dataType: string;
}

export interface IPosition {
  x: number;
  y: number;
}

export interface IConnection extends IEntity {
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface IWorkflow extends IEntity {
  name: string;
  description: string;
  nodes: INode[];
  connections: IConnection[];
  isActive: boolean;
}

export interface IAutomation extends IEntity {
  name: string;
  description: string;
  workflow: IWorkflow;
  executionHistory: IExecution[];
}

export interface IExecution extends IEntity {
  automationId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: Record<string, any>;
  error?: string;
}
