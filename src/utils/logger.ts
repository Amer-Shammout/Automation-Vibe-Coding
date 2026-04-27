/**
 * Logger utility for consistent logging
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (level === LogLevel.ERROR) {
      console.error(prefix, message, data);
    } else if (level === LogLevel.WARN) {
      console.warn(prefix, message, data);
    } else if (this.isDevelopment) {
      console.log(prefix, message, data);
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, error?.message || error);
  }
}

export const logger = new Logger();
