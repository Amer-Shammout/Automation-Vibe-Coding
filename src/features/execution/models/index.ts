/**
 * Execution Models - Execution history and logs
 */

export interface IExecutionLog {
  id: string;
  executionId: string;
  nodeId: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, any>;
}

export interface IExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecuted?: Date;
}

export interface IExecution {
  id: string;
  automationId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
