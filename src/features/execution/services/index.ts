/**
 * Execution Service - Handles API calls for execution management
 */

import { IExecution, IExecutionLog, IExecutionMetrics } from '../models';
import { apiClient } from '../../../api/client';

export class ExecutionService {
  private baseUrl = '/api/executions';

  async fetchExecutions(automationId: string): Promise<IExecution[]> {
    const response = await apiClient.get<IExecution[]>(`${this.baseUrl}?automationId=${automationId}`);
    return response;
  }

  async fetchExecution(id: string): Promise<IExecution> {
    const response = await apiClient.get<IExecution>(`${this.baseUrl}/${id}`);
    return response;
  }

  async fetchExecutionLogs(executionId: string): Promise<IExecutionLog[]> {
    const response = await apiClient.get<IExecutionLog[]>(`${this.baseUrl}/${executionId}/logs`);
    return response;
  }

  async fetchMetrics(automationId: string): Promise<IExecutionMetrics> {
    const response = await apiClient.get<IExecutionMetrics>(`/api/automations/${automationId}/metrics`);
    return response;
  }

  async retryExecution(executionId: string): Promise<IExecution> {
    const response = await apiClient.post<IExecution>(`${this.baseUrl}/${executionId}/retry`, {});
    return response;
  }

  async stopExecution(executionId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${executionId}/stop`, {});
  }

  async deleteExecution(executionId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${executionId}`);
  }
}

export const executionService = new ExecutionService();
