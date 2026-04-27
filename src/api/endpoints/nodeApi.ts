/**
 * Node library API endpoints
 */

import { apiClient } from '../client';

const ENDPOINT = '/nodes';

export const nodeApi = {
  listTemplates: () => apiClient.get(`${ENDPOINT}/templates`),

  getTemplate: (id: string) => apiClient.get(`${ENDPOINT}/templates/${id}`),

  listByCategory: (category: string) => apiClient.get(`${ENDPOINT}/templates?category=${category}`),

  search: (query: string) => apiClient.get(`${ENDPOINT}/search?q=${query}`),

  validate: (node: any) => apiClient.post(`${ENDPOINT}/validate`, node),

  getDefaultConfig: (nodeType: string) => apiClient.get(`${ENDPOINT}/${nodeType}/default-config`),
};
