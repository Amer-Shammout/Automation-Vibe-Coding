/**
 * Automation API endpoints
 */

import { apiClient } from '../client';
import { CreateAutomationRequest, UpdateAutomationRequest } from '../types';

const ENDPOINT = '/automations';

export const automationApi = {
  list: (page = 1, pageSize = 10) => apiClient.get(`${ENDPOINT}?page=${page}&pageSize=${pageSize}`),

  get: (id: string) => apiClient.get(`${ENDPOINT}/${id}`),

  create: (data: CreateAutomationRequest) => apiClient.post(ENDPOINT, data),

  update: (id: string, data: UpdateAutomationRequest) => apiClient.put(`${ENDPOINT}/${id}`, data),

  delete: (id: string) => apiClient.delete(`${ENDPOINT}/${id}`),

  execute: (id: string) => apiClient.post(`${ENDPOINT}/${id}/execute`, {}),

  duplicate: (id: string) => apiClient.post(`${ENDPOINT}/${id}/duplicate`, {}),

  getExecutionHistory: (id: string) => apiClient.get(`${ENDPOINT}/${id}/executions`),
};
