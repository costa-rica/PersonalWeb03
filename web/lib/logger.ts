import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Only initialize Winston on the server side
const isServer = typeof window === 'undefined';

let logger: winston.Logger;
let isInitialized = false;

/**
 * Initialize the Winston logger
 * This should be called once during application startup
 */
export function initializeLogger(): void {
  // Skip initialization on client side or if already initialized
  if (!isServer || isInitialized) {
    return;
  }

  // Get environment variables
  const mode = process.env.NEXT_PUBLIC_MODE || 'development';
  const isProduction = mode === 'production';
  const appName = process.env.NEXT_PUBLIC_NAME_APP || 'PersonalWeb03';
  const logDir = process.env.PATH_TO_LOGS || './logs';
  const maxSize = parseInt(process.env.LOG_MAX_SIZE || '10485760'); // 10MB default
  const maxFiles = parseInt(process.env.LOG_MAX_FILES || '10');

  // Define log format for files (production)
  const fileLogFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      // Handle Error objects with stack traces
      if (stack) {
        return `[${timestamp}] [${level.toUpperCase()}] [${appName}] ${message}\n${stack}`;
      }

      // Handle metadata
      const metaKeys = Object.keys(meta);
      const metaStr = metaKeys.length > 0 ? ' ' + JSON.stringify(meta) : '';
      return `[${timestamp}] [${level.toUpperCase()}] [${appName}] ${message}${metaStr}`;
    })
  );

  // Define log format for console (development)
  const consoleLogFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const metaKeys = Object.keys(meta);
      const metaStr = metaKeys.length > 0 ? ' ' + JSON.stringify(meta) : '';

      if (stack) {
        return `${timestamp} ${level} [${appName}] ${message}\n${stack}`;
      }

      return `${timestamp} ${level} [${appName}] ${message}${metaStr}`;
    })
  );

  // Create logger instance
  logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? fileLogFormat : consoleLogFormat,
    transports: [],
  });

  // Add transports based on environment
  if (isProduction) {
    try {
      // Create log directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true, mode: 0o750 });
      }

      // Add file transport
      logger.add(
        new winston.transports.File({
          filename: path.join(logDir, `${appName}.log`),
          maxsize: maxSize,
          maxFiles: maxFiles,
          tailable: true,
        })
      );

      // Set restrictive permissions on log files
      const logFilePath = path.join(logDir, `${appName}.log`);
      if (fs.existsSync(logFilePath)) {
        fs.chmodSync(logFilePath, 0o640);
      }
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('Failed to initialize file logging, falling back to console:', error);
      logger.add(new winston.transports.Console({ format: consoleLogFormat }));
    }
  } else {
    // Development mode: console only
    logger.add(new winston.transports.Console({ format: consoleLogFormat }));
  }

  // Monkey-patch console methods to use Winston
  // Store original console methods for internal use
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  // Override console methods
  console.log = (...args: any[]) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logger.info(message);
  };

  console.error = (...args: any[]) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logger.error(message);
  };

  console.warn = (...args: any[]) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logger.warn(message);
  };

  console.info = (...args: any[]) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logger.info(message);
  };

  console.debug = (...args: any[]) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logger.debug(message);
  };

  // Handle uncaught exceptions
  logger.exceptions.handle(
    new winston.transports.File({
      filename: isProduction ? path.join(logDir, `${appName}-exceptions.log`) : '/tmp/exceptions.log'
    })
  );

  // Handle unhandled promise rejections
  logger.rejections.handle(
    new winston.transports.File({
      filename: isProduction ? path.join(logDir, `${appName}-rejections.log`) : '/tmp/rejections.log'
    })
  );

  isInitialized = true;

  // Log initialization
  logger.info('Winston logger initialized', {
    mode,
    appName,
    logDir: isProduction ? logDir : 'console-only',
  });
}

/**
 * Get the logger instance
 * For direct usage instead of console methods (optional, for Phase 2 migration)
 */
export function getLogger(): winston.Logger {
  if (!isServer) {
    throw new Error('Logger can only be used on the server side');
  }

  if (!isInitialized) {
    initializeLogger();
  }

  return logger;
}

// Export logger for direct usage (Phase 2 migration)
export default logger;
