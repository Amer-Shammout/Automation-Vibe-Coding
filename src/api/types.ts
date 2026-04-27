/**
 * API request/response types
 */

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Automation API types
export interface CreateAutomationRequest {
  name: string;
  description?: string;
  workflowId: string;
}

export interface UpdateAutomationRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Workflow API types
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes?: any[];
  connections?: any[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: any[];
  connections?: any[];
  isActive?: boolean;
}

// Execution API types
export interface ExecutionResponse {
  id: string;
  automationId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: string;
  endTime?: string;
  result?: Record<string, any>;
  error?: string;
}
