/**
 * Formatting utilities
 */

export const formatters = {
  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDateTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },

  formatTime: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  },

  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  toCamelCase: (str: string): string => {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  },

  toKebabCase: (str: string): string => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  },

  truncate: (str: string, length: number): string => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  },
};
