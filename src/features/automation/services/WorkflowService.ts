/**
 * Workflow Service - Handles API calls for workflow operations
 */

import { IWorkflow, INode, IConnection } from '../models/types';
import { apiClient } from '../../../api/client';

export class WorkflowService {
  private baseUrl = '/api/workflows';

  async fetchWorkflow(id: string): Promise<IWorkflow> {
    const response = await apiClient.get<IWorkflow>(`${this.baseUrl}/${id}`);
    return response;
  }

  async createWorkflow(data: Omit<IWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<IWorkflow> {
    const response = await apiClient.post<IWorkflow>(this.baseUrl, data);
    return response;
  }

  async updateWorkflow(id: string, data: Partial<IWorkflow>): Promise<IWorkflow> {
    const response = await apiClient.put<IWorkflow>(`${this.baseUrl}/${id}`, data);
    return response;
  }

  async saveWorkflow(workflow: IWorkflow): Promise<IWorkflow> {
    return this.updateWorkflow(workflow.id, workflow);
  }

  async validateWorkflow(workflow: IWorkflow): Promise<{ valid: boolean; errors: string[] }> {
    const response = await apiClient.post<{ valid: boolean; errors: string[] }>(
      `${this.baseUrl}/${workflow.id}/validate`,
      workflow
    );
    return response;
  }

  async addNode(workflowId: string, node: INode): Promise<IWorkflow> {
    const response = await apiClient.post<IWorkflow>(`${this.baseUrl}/${workflowId}/nodes`, node);
    return response;
  }

  async removeNode(workflowId: string, nodeId: string): Promise<IWorkflow> {
    const response = await apiClient.delete<IWorkflow>(`${this.baseUrl}/${workflowId}/nodes/${nodeId}`);
    return response;
  }

  async addConnection(workflowId: string, connection: IConnection): Promise<IWorkflow> {
    const response = await apiClient.post<IWorkflow>(`${this.baseUrl}/${workflowId}/connections`, connection);
    return response;
  }

  async removeConnection(workflowId: string, connectionId: string): Promise<IWorkflow> {
    const response = await apiClient.delete<IWorkflow>(`${this.baseUrl}/${workflowId}/connections/${connectionId}`);
    return response;
  }
}

export const workflowService = new WorkflowService();
