/**
 * Automation Service - Handles API calls for automation operations
 */

import { IAutomation } from '../models/types';
import { apiClient } from '../../../api/client';

export class AutomationService {
  private baseUrl = '/api/automations';

  async fetchAutomations(): Promise<IAutomation[]> {
    const response = await apiClient.get<IAutomation[]>(this.baseUrl);
    return response;
  }

  async fetchAutomation(id: string): Promise<IAutomation> {
    const response = await apiClient.get<IAutomation>(`${this.baseUrl}/${id}`);
    return response;
  }

  async createAutomation(data: Omit<IAutomation, 'id' | 'createdAt' | 'updatedAt'>): Promise<IAutomation> {
    const response = await apiClient.post<IAutomation>(this.baseUrl, data);
    return response;
  }

  async updateAutomation(id: string, data: Partial<IAutomation>): Promise<IAutomation> {
    const response = await apiClient.put<IAutomation>(`${this.baseUrl}/${id}`, data);
    return response;
  }

  async deleteAutomation(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async duplicateAutomation(id: string): Promise<IAutomation> {
    const response = await apiClient.post<IAutomation>(`${this.baseUrl}/${id}/duplicate`, {});
    return response;
  }

  async executeAutomation(id: string): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/execute`, {});
    return response;
  }
}

export const automationService = new AutomationService();
