/**
 * Execution ViewModel - Manages execution state and history
 */

import { IExecution, IExecutionLog, IExecutionMetrics } from '../models';

export class ExecutionViewModel {
  private executions: IExecution[] = [];
  private executionLogs: Map<string, IExecutionLog[]> = new Map();
  private metrics: IExecutionMetrics | null = null;

  constructor(private executionService: any) {}

  getExecutions(): IExecution[] {
    return this.executions;
  }

  getExecutionLogs(executionId: string): IExecutionLog[] {
    return this.executionLogs.get(executionId) || [];
  }

  getMetrics(): IExecutionMetrics | null {
    return this.metrics;
  }

  async loadExecutions(automationId: string): Promise<void> {
    try {
      const executions = await this.executionService.fetchExecutions(automationId);
      this.executions = executions;
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  }

  async loadExecutionLogs(executionId: string): Promise<void> {
    const logs = await this.executionService.fetchExecutionLogs(executionId);
    this.executionLogs.set(executionId, logs);
  }

  async loadMetrics(automationId: string): Promise<void> {
    this.metrics = await this.executionService.fetchMetrics(automationId);
  }

  async retryExecution(executionId: string): Promise<IExecution> {
    const execution = await this.executionService.retryExecution(executionId);
    this.executions.push(execution);
    return execution;
  }
}
