/**
 * Execution API endpoints
 */

import { apiClient } from '../client';

const ENDPOINT = '/executions';

export const executionApi = {
  list: (automationId: string) => apiClient.get(`${ENDPOINT}?automationId=${automationId}`),

  get: (id: string) => apiClient.get(`${ENDPOINT}/${id}`),

  getLogs: (id: string) => apiClient.get(`${ENDPOINT}/${id}/logs`),

  getMetrics: (automationId: string) => apiClient.get(`/automations/${automationId}/metrics`),

  retry: (id: string) => apiClient.post(`${ENDPOINT}/${id}/retry`, {}),

  stop: (id: string) => apiClient.post(`${ENDPOINT}/${id}/stop`, {}),

  delete: (id: string) => apiClient.delete(`${ENDPOINT}/${id}`),

  deleteAll: (automationId: string) => apiClient.delete(`${ENDPOINT}?automationId=${automationId}`),
};
