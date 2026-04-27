/**
 * Workflow step definitions
 */

import { INode, INodePort } from './Automation';

export interface IWorkflowStepTemplate {
  id: string;
  category: 'trigger' | 'action' | 'condition' | 'transform';
  name: string;
  description: string;
  icon?: string;
  inputs: INodePort[];
  outputs: INodePort[];
  configSchema: Record<string, any>;
}

export interface INodeTemplate extends IWorkflowStepTemplate {
  factory: () => INode;
}

export const WorkflowStepCategories = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  TRANSFORM: 'transform',
} as const;

export type WorkflowStepCategory = (typeof WorkflowStepCategories)[keyof typeof WorkflowStepCategories];
