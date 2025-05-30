/**
 * BrainSAIT Unified Logging System
 * 
 * Modern structured logging for Cloudflare Workers with:
 * - JSON structured output for better observability
 * - Request correlation IDs
 * - Performance metrics
 * - Healthcare compliance logging
 * - Environment-based log levels
 * 
 * Uses the new Cloudflare Workers structured logging API
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  service?: string;
  version?: string;
  environment?: string;
  timestamp?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memory?: number;
    cpu?: number;
  };
  security?: {
    userAgent?: string;
    ip?: string;
    location?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  compliance?: {
    phi?: boolean; // Protected Health Information
    pii?: boolean; // Personally Identifiable Information
    audit?: boolean; // Requires audit trail
    retention?: number; // Days to retain
  };
}

class Logger {
  private defaultContext: LogContext;
  private logLevel: LogLevel;
  private startTime: number;

  constructor(context: Partial<LogContext> = {}) {
    this.defaultContext = {
      service: 'brainsait-unified',
      version: '1.0.0',
      environment: 'production',
      timestamp: new Date().toISOString(),
      ...context
    };
    
    // Set log level based on environment
    this.logLevel = this.getLogLevel(this.defaultContext.environment || 'production');
    this.startTime = Date.now();
  }

  private getLogLevel(environment: string): LogLevel {
    switch (environment) {
      case 'development':
      case 'dev':
        return 'debug';
      case 'staging':
      case 'test':
        return 'info';
      case 'production':
      case 'prod':
      default:
        return 'warn';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context: Partial<LogContext> = {},
    error?: Error,
    additionalData?: Partial<LogEntry>
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context: {
        ...this.defaultContext,
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        ...context
      },
      ...additionalData
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Use structured JSON logging for Cloudflare Workers
    const structuredLog = {
      '@timestamp': entry.context.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message,
      service: entry.context.service,
      version: entry.context.version,
      environment: entry.context.environment,
      requestId: entry.context.requestId,
      userId: entry.context.userId,
      operation: entry.context.operation,
      duration: entry.context.duration,
      ...entry.context.metadata,
      ...(entry.error && { error: entry.error }),
      ...(entry.performance && { performance: entry.performance }),
      ...(entry.security && { security: entry.security }),
      ...(entry.compliance && { compliance: entry.compliance })
    };

    // Use appropriate console method based on level
    switch (entry.level) {
      case 'debug':
        console.debug(JSON.stringify(structuredLog));
        break;
      case 'info':
        console.info(JSON.stringify(structuredLog));
        break;
      case 'warn':
        console.warn(JSON.stringify(structuredLog));
        break;
      case 'error':
      case 'fatal':
        console.error(JSON.stringify(structuredLog));
        break;
    }
  }

  // Core logging methods
  debug(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('debug', message, { ...context, metadata }));
  }

  info(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('info', message, { ...context, metadata }));
  }

  warn(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('warn', message, { ...context, metadata }));
  }

  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.output(this.formatLogEntry('error', message, context, error));
  }

  fatal(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.output(this.formatLogEntry('fatal', message, context, error));
  }

  // Specialized logging methods for BrainSAIT
  
  /**
   * Log authentication events (login, logout, token refresh)
   */
  auth(action: string, userId?: string, success: boolean = true, metadata?: Record<string, any>): void {
    this.info(`Authentication: ${action}`, {
      operation: 'auth',
      userId,
      metadata: { action, success, ...metadata }
    });
  }

  /**
   * Log NPHIES integration events
   */
  nphies(action: string, claimId?: string, status?: string, metadata?: Record<string, any>): void {
    this.info(`NPHIES: ${action}`, {
      operation: 'nphies',
      metadata: { action, claimId, status, ...metadata }
    }, {
      compliance: {
        phi: true,
        audit: true,
        retention: 2555 // 7 years for healthcare records
      }
    });
  }

  /**
   * Log payment processing events
   */
  payment(action: string, amount?: number, currency?: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`Payment: ${action}`, {
      operation: 'payment',
      userId,
      metadata: { action, amount, currency, ...metadata }
    }, {
      compliance: {
        pii: true,
        audit: true,
        retention: 2555 // Financial records retention
      }
    });
  }

  /**
   * Log API requests with performance metrics
   */
  apiRequest(method: string, path: string, statusCode: number, duration: number, context?: Partial<LogContext>): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.output(this.formatLogEntry(level, `API ${method} ${path}`, {
      operation: 'api_request',
      ...context,
      metadata: { method, path, statusCode }
    }, undefined, {
      performance: { duration }
    }));
  }

  /**
   * Log security events (failed logins, suspicious activity, etc.)
   */
  security(
    event: string, 
    riskLevel: 'low' | 'medium' | 'high' = 'medium',
    userAgent?: string,
    ip?: string,
    metadata?: Record<string, any>
  ): void {
    const level: LogLevel = riskLevel === 'high' ? 'error' : riskLevel === 'medium' ? 'warn' : 'info';
    
    this.output(this.formatLogEntry(level, `Security: ${event}`, {
      operation: 'security',
      metadata: { event, ...metadata }
    }, undefined, {
      security: { userAgent, ip, riskLevel },
      compliance: { audit: true, retention: 2555 }
    }));
  }

  /**
   * Log healthcare compliance events
   */
  compliance(event: string, hasPHI: boolean = false, hasPII: boolean = false, metadata?: Record<string, any>): void {
    this.info(`Compliance: ${event}`, {
      operation: 'compliance',
      metadata: { event, ...metadata }
    }, {
      compliance: {
        phi: hasPHI,
        pii: hasPII,
        audit: true,
        retention: hasPHI ? 2555 : 365 // PHI requires longer retention
      }
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): Logger {
    return new Logger({
      ...this.defaultContext,
      ...additionalContext
    });
  }

  /**
   * Create a timer for measuring operation duration
   */
  timer(operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Operation completed: ${operation}`, {
        operation,
        metadata: { duration }
      }, {
        performance: { duration }
      });
    };
  }
}

// Request-scoped logger factory
export function createLogger(request?: Request, env?: any): Logger {
  const requestId = request?.headers.get('x-request-id') || 
                   request?.headers.get('cf-ray') || 
                   crypto.randomUUID();
  
  const userAgent = request?.headers.get('user-agent');
  const ip = request?.headers.get('cf-connecting-ip') || 
            request?.headers.get('x-forwarded-for');

  const environment = env?.NODE_ENV || env?.ENVIRONMENT || 'production';

  return new Logger({
    requestId,
    environment,
    metadata: {
      userAgent: userAgent?.substring(0, 200), // Truncate long user agents
      ip: ip ? hashIP(ip) : undefined // Hash IP for privacy
    }
  });
}

// Utility function to hash IP addresses for privacy
function hashIP(ip: string): string {
  // Simple hash for IP privacy - in production, use a proper HMAC
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `ip_${Math.abs(hash).toString(16)}`;
}

// Export singleton logger for cases where request context isn't available
export const logger = new Logger();

// Export types for external usage
export type { LogLevel, LogContext, LogEntry };