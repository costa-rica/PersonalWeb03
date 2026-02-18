// SECURITY: Security event logging utility
// Logs security-relevant events for detection, response, and forensics

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityEventType =
  | 'INVALID_INPUT'
  | 'SUSPICIOUS_PATTERN'
  | 'AUTHENTICATION_FAILURE'
  | 'AUTHENTICATION_SUCCESS'
  | 'INVALID_TOKEN'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'REGISTRATION_SUCCESS'
  | 'REGISTRATION_FAILURE';

interface SecurityEvent {
  timestamp: string;
  app: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  ip?: string;
  endpoint?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

// SECURITY: Sanitize sensitive data from log details
function sanitizeLogDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'jwt', 'auth'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    const isSensitive = sensitiveFields.some(field =>
      key.toLowerCase().includes(field.toLowerCase())
    );
    sanitized[key] = isSensitive ? '[REDACTED]' : value;
  }

  return sanitized;
}

// SECURITY: Main logging function
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'app'>): void {
  const logEntry: SecurityEvent = {
    timestamp: new Date().toISOString(),
    app: 'PersonalWeb03-NextJs',
    ...event,
    ip: event.ip || 'client-side',
    details: sanitizeLogDetails(event.details),
  };

  // Use console.warn for security events so they're more visible in logs
  // In production with PM2, these will be captured in log files
  console.warn('[SECURITY]', JSON.stringify(logEntry));

  // In development, also log a human-readable version
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[SECURITY ${event.severity}] ${event.type}: ${event.message}`,
      event.details ? sanitizeLogDetails(event.details) : ''
    );
  }
}

// SECURITY: Helper to detect suspicious patterns in user input
export function detectSuspiciousPatterns(input: string): string[] {
  const suspiciousPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /eval\s*\(/i, name: 'eval()' },
    { pattern: /exec\s*\(/i, name: 'exec()' },
    { pattern: /child_process/i, name: 'child_process' },
    { pattern: /\.\.\//g, name: 'path_traversal' },
    { pattern: /<script/i, name: 'xss_script_tag' },
    { pattern: /javascript:/i, name: 'javascript_protocol' },
    { pattern: /on\w+\s*=/i, name: 'event_handler' },
    { pattern: /union.*select/i, name: 'sql_union' },
    { pattern: /select.*from/i, name: 'sql_select' },
    { pattern: /drop.*table/i, name: 'sql_drop' },
    { pattern: /insert.*into/i, name: 'sql_insert' },
    { pattern: /;.*--|\/\*|\*\//g, name: 'sql_comment' },
    { pattern: /base64/i, name: 'base64_encoding' },
    { pattern: /cmd\.exe|powershell|bash|sh\s/i, name: 'shell_command' },
  ];

  const detected: string[] = [];

  for (const { pattern, name } of suspiciousPatterns) {
    if (pattern.test(input)) {
      detected.push(name);
    }
  }

  return detected;
}

// SECURITY: Log validation failure with pattern detection
export function logValidationFailure(
  endpoint: string,
  errors: Record<string, string>,
  inputValues?: Record<string, unknown>
): void {
  // Detect suspicious patterns in input values
  const suspiciousPatterns: string[] = [];
  if (inputValues) {
    for (const [field, value] of Object.entries(inputValues)) {
      if (typeof value === 'string') {
        const patterns = detectSuspiciousPatterns(value);
        if (patterns.length > 0) {
          suspiciousPatterns.push(`${field}:${patterns.join(',')}`);
        }
      }
    }
  }

  const severity: SecuritySeverity = suspiciousPatterns.length > 0 ? 'HIGH' : 'MEDIUM';

  logSecurityEvent({
    type: 'INVALID_INPUT',
    severity,
    message: `Input validation failed on ${endpoint}`,
    endpoint,
    details: {
      errorCount: Object.keys(errors).length,
      errorFields: Object.keys(errors),
      suspiciousPatterns: suspiciousPatterns.length > 0 ? suspiciousPatterns : undefined,
    },
  });
}

// SECURITY: Log authentication events
export function logAuthEvent(
  type: SecurityEventType,
  success: boolean,
  email?: string,
  details?: Record<string, unknown>
): void {
  const severity: SecuritySeverity = success ? 'LOW' : 'MEDIUM';
  
  logSecurityEvent({
    type,
    severity,
    message: success 
      ? `${type} successful${email ? ` for ${email}` : ''}` 
      : `${type} failed${email ? ` for ${email}` : ''}`,
    endpoint: '/auth',
    details: {
      email: email || undefined,
      ...details,
    },
  });
}
