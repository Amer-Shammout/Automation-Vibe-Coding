/**
 * Node Library Models - Defines available node types
 */

import { IWorkflowStepTemplate, WorkflowStepCategory } from '../../automation/models/types';

export interface INodeLibraryItem extends IWorkflowStepTemplate {
  version: string;
  tags: string[];
}

export interface INodeLibrary {
  nodes: INodeLibraryItem[];
  categories: Record<WorkflowStepCategory, string>;
}
