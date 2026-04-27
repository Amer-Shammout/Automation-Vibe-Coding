/**
 * Constants for the application
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  TRANSFORM: 'transform',
} as const;

export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export const THEME_VALUES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'Unauthorized access.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;
