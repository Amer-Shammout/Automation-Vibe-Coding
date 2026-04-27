/**
 * Common shared types
 */

export interface IEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
