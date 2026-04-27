/**
 * Automation ViewModel - Core business logic for automation management
 * Follows MVVM pattern: handles state, validation, and operations
 */

import { IAutomation } from '../models/types';
import { AsyncState } from '../../../types/common';

export class AutomationViewModel {
  private automations: IAutomation[] = [];
  private selectedAutomation: IAutomation | null = null;
  private loading: AsyncState<IAutomation[]> = { status: 'idle' };

  constructor(private automationService: any) {}

  // Getters
  getAutomations(): IAutomation[] {
    return this.automations;
  }

  getSelectedAutomation(): IAutomation | null {
    return this.selectedAutomation;
  }

  getLoading(): AsyncState<IAutomation[]> {
    return this.loading;
  }

  // Public methods
  async loadAutomations(): Promise<void> {
    this.loading = { status: 'loading' };
    try {
      const automations = await this.automationService.fetchAutomations();
      this.automations = automations;
      this.loading = { status: 'success', data: automations };
    } catch (error) {
      this.loading = { status: 'error', error: error as Error };
    }
  }

  async createAutomation(automation: Omit<IAutomation, 'id' | 'createdAt' | 'updatedAt'>): Promise<IAutomation> {
    const created = await this.automationService.createAutomation(automation);
    this.automations.push(created);
    return created;
  }

  async updateAutomation(id: string, updates: Partial<IAutomation>): Promise<IAutomation> {
    const updated = await this.automationService.updateAutomation(id, updates);
    const index = this.automations.findIndex(a => a.id === id);
    if (index !== -1) {
      this.automations[index] = updated;
    }
    if (this.selectedAutomation?.id === id) {
      this.selectedAutomation = updated;
    }
    return updated;
  }

  async deleteAutomation(id: string): Promise<void> {
    await this.automationService.deleteAutomation(id);
    this.automations = this.automations.filter(a => a.id !== id);
    if (this.selectedAutomation?.id === id) {
      this.selectedAutomation = null;
    }
  }

  selectAutomation(automation: IAutomation): void {
    this.selectedAutomation = automation;
  }

  clearSelection(): void {
    this.selectedAutomation = null;
  }
}
