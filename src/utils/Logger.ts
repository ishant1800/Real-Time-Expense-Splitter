import { env } from '../config/env';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    // Standard structured string suitable for systems like CloudWatch, Stackdriver, or PM2
    return `[${this.getTimestamp()}] [${level}] ${message}${metaStr}`;
  }

  public debug(message: string, meta?: any): void {
    if (env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  public info(message: string, meta?: any): void {
    console.log(this.formatMessage('INFO', message, meta));
  }

  public warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  public error(message: string, error?: Error | unknown, meta?: any): void {
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    
    console.error(
      this.formatMessage(
        'ERROR', 
        message, 
        errorDetails ? { ...meta, error: errorDetails } : meta
      )
    );
  }
}

export const logger = new Logger();
