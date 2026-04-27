/**
 * Workflow ViewModel - Business logic for workflow/node canvas management
 */

import { IWorkflow, INode, IConnection, IPosition } from '../models/types';

export class WorkflowViewModel {
  private workflow: IWorkflow | null = null;

  constructor(private workflowService: any) {}

  getWorkflow(): IWorkflow | null {
    return this.workflow;
  }

  async loadWorkflow(workflowId: string): Promise<IWorkflow> {
    const workflow = await this.workflowService.fetchWorkflow(workflowId);
    this.workflow = workflow;
    return workflow;
  }

  async updateWorkflow(updates: Partial<IWorkflow>): Promise<IWorkflow> {
    if (!this.workflow) throw new Error('No workflow selected');
    const updated = await this.workflowService.updateWorkflow(this.workflow.id, updates);
    this.workflow = updated;
    return updated;
  }

  addNode(node: INode): void {
    if (!this.workflow) return;
    this.workflow.nodes.push(node);
  }

  removeNode(nodeId: string): void {
    if (!this.workflow) return;
    this.workflow.nodes = this.workflow.nodes.filter((n: any) => n.id !== nodeId);
    // Also remove connections
    this.workflow.connections = this.workflow.connections.filter(
      (c: any) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );
  }

  updateNodePosition(nodeId: string, position: IPosition): void {
    if (!this.workflow) return;
    const node = this.workflow.nodes.find((n: any) => n.id === nodeId);
    if (node) {
      node.position = position;
    }
  }

  addConnection(connection: IConnection): void {
    if (!this.workflow) return;
    this.workflow.connections.push(connection);
  }

  removeConnection(connectionId: string): void {
    if (!this.workflow) return;
    this.workflow.connections = this.workflow.connections.filter((c: any) => c.id !== connectionId);
  }

  async saveWorkflow(): Promise<void> {
    if (!this.workflow) throw new Error('No workflow to save');
    await this.workflowService.saveWorkflow(this.workflow);
  }
}
