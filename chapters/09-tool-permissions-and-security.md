# Chapter 9: Tool Permissions and Security

> "Just because you're paranoid doesn't mean your code isn't trying to delete everything."
> 
> — Clide, on implementing security layers

Security is paramount when enabling autonomous development workflows. Claude Code's power comes with the responsibility to implement robust security measures that protect your codebase, infrastructure, and sensitive data while maintaining development velocity.

## Understanding the Security Model

### Permission Layers

Claude Code operates with multiple security layers:

1. **System-level permissions**: OS and file system access
2. **Tool-level permissions**: What tools can execute
3. **Network permissions**: External service access
4. **Data permissions**: What information can be accessed or modified
5. **Context permissions**: What project information is available

```json
{
  "security": {
    "version": "1.0",
    "permissions": {
      "filesystem": {
        "read": ["./src/**", "./tests/**", "./docs/**"],
        "write": ["./src/**", "./tests/**"],
        "execute": ["./scripts/**"],
        "forbidden": ["./secrets/**", "./.env", "./private/**"]
      },
      "network": {
        "allowed_domains": [
          "api.github.com",
          "registry.npmjs.org",
          "*.sentry.io"
        ],
        "blocked_domains": [
          "*.internal.company.com"
        ]
      },
      "tools": {
        "enabled": ["git", "npm", "test", "build"],
        "restricted": ["deploy", "database"],
        "forbidden": ["ssh", "sudo", "rm -rf"]
      }
    }
  }
}
```

### MCP Security Configuration

Secure your MCP server with proper permissions:

```javascript
class SecureProjectToolsServer {
  constructor() {
    this.permissions = new PermissionManager();
    this.auditLogger = new AuditLogger();
    this.rateLimiter = new RateLimiter();
  }
  
  async executeCommand(command, context = {}) {
    // Security checks before execution
    await this.validatePermissions(command, context);
    await this.checkRateLimit(context.user || 'system');
    await this.scanForSecurityIssues(command);
    
    // Log the attempt
    this.auditLogger.logAttempt({
      command,
      context,
      timestamp: new Date().toISOString(),
      user: context.user
    });
    
    try {
      const result = await this.safeExecute(command, context);
      
      // Log successful execution
      this.auditLogger.logSuccess({
        command,
        result: this.sanitizeForLogging(result),
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      // Log failed execution
      this.auditLogger.logError({
        command,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
  
  async validatePermissions(command, context) {
    const requiredPermissions = this.analyzeCommandPermissions(command);
    
    for (const permission of requiredPermissions) {
      if (!await this.permissions.hasPermission(permission, context)) {
        throw new SecurityError(`Permission denied: ${permission}`);
      }
    }
  }
  
  analyzeCommandPermissions(command) {
    const permissions = [];
    
    // File system permissions
    if (command.includes('read') || command.includes('cat')) {
      permissions.push('filesystem:read');
    }
    if (command.includes('write') || command.includes('>')) {
      permissions.push('filesystem:write');
    }
    if (command.includes('rm') || command.includes('delete')) {
      permissions.push('filesystem:delete');
    }
    
    // Network permissions
    if (command.includes('curl') || command.includes('fetch')) {
      permissions.push('network:outbound');
    }
    
    // Execution permissions
    if (command.includes('npm') || command.includes('node')) {
      permissions.push('tools:nodejs');
    }
    if (command.includes('git')) {
      permissions.push('tools:git');
    }
    
    return permissions;
  }
}

class PermissionManager {
  constructor() {
    this.rules = this.loadPermissionRules();
  }
  
  async hasPermission(permission, context) {
    const [category, action] = permission.split(':');
    const rule = this.rules[category]?.[action];
    
    if (!rule) {
      return false; // Deny by default
    }
    
    // Check context-based permissions
    if (rule.contexts && !rule.contexts.includes(context.environment)) {
      return false;
    }
    
    // Check time-based permissions
    if (rule.timeRestrictions) {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < rule.timeRestrictions.start || hour > rule.timeRestrictions.end) {
        return false;
      }
    }
    
    return rule.allowed;
  }
  
  loadPermissionRules() {
    return {
      filesystem: {
        read: {
          allowed: true,
          contexts: ['development', 'testing'],
          paths: ['./src/**', './tests/**', './docs/**']
        },
        write: {
          allowed: true,
          contexts: ['development'],
          paths: ['./src/**', './tests/**'],
          excludePaths: ['./.env', './secrets/**']
        },
        delete: {
          allowed: false, // Require explicit approval
          contexts: [],
          requiresApproval: true
        }
      },
      network: {
        outbound: {
          allowed: true,
          contexts: ['development', 'testing'],
          domains: ['api.github.com', 'registry.npmjs.org']
        }
      },
      tools: {
        git: {
          allowed: true,
          contexts: ['development', 'testing', 'staging'],
          operations: ['status', 'add', 'commit', 'push', 'pull']
        },
        npm: {
          allowed: true,
          contexts: ['development', 'testing'],
          operations: ['install', 'test', 'build']
        }
      }
    };
  }
}
```

## Secrets Management

### Environment Variable Security

Implement secure environment variable handling:

```javascript
class SecureEnvironmentManager {
  constructor() {
    this.sensitivePatterns = [
      /API_KEY/i,
      /SECRET/i,
      /PASSWORD/i,
      /TOKEN/i,
      /PRIVATE_KEY/i,
      /DATABASE_URL/i
    ];
    
    this.vault = new SecretsVault();
  }
  
  async loadEnvironment(environment = 'development') {
    const envFile = `.env.${environment}`;
    const variables = await this.parseEnvFile(envFile);
    
    // Separate sensitive from non-sensitive variables
    const { sensitive, nonSensitive } = this.categorizeVariables(variables);
    
    // Store sensitive variables securely
    for (const [key, value] of Object.entries(sensitive)) {
      await this.vault.store(key, value, { environment });
    }
    
    // Return only non-sensitive variables for logging
    return {
      environment,
      variables: nonSensitive,
      sensitiveCount: Object.keys(sensitive).length
    };
  }
  
  categorizeVariables(variables) {
    const sensitive = {};
    const nonSensitive = {};
    
    for (const [key, value] of Object.entries(variables)) {
      if (this.isSensitive(key)) {
        sensitive[key] = value;
      } else {
        nonSensitive[key] = value;
      }
    }
    
    return { sensitive, nonSensitive };
  }
  
  isSensitive(key) {
    return this.sensitivePatterns.some(pattern => pattern.test(key));
  }
  
  async getSecureVariable(key, context) {
    // Validate permission to access this variable
    if (!await this.hasPermission(key, context)) {
      throw new SecurityError(`Access denied to variable: ${key}`);
    }
    
    return await this.vault.retrieve(key, context);
  }
  
  sanitizeForLogging(data) {
    if (typeof data === 'string') {
      return this.redactSensitiveData(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitive(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
  
  redactSensitiveData(text) {
    // Common patterns for sensitive data
    const patterns = [
      { regex: /([a-zA-Z0-9+/]{40,}={0,2})/, replacement: '[TOKEN_REDACTED]' },
      { regex: /(pk_[a-zA-Z0-9]{50,})/, replacement: '[API_KEY_REDACTED]' },
      { regex: /(sk_[a-zA-Z0-9]{50,})/, replacement: '[SECRET_KEY_REDACTED]' },
      { regex: /(ghp_[a-zA-Z0-9]{36})/, replacement: '[GITHUB_TOKEN_REDACTED]' },
      { regex: /(postgres:\/\/[^:]+:[^@]+@[^\/]+\/\w+)/, replacement: '[DATABASE_URL_REDACTED]' }
    ];
    
    let sanitized = text;
    for (const { regex, replacement } of patterns) {
      sanitized = sanitized.replace(regex, replacement);
    }
    
    return sanitized;
  }
}

class SecretsVault {
  constructor() {
    this.storage = new Map();
    this.encryption = new EncryptionManager();
  }
  
  async store(key, value, metadata = {}) {
    const encrypted = await this.encryption.encrypt(value);
    
    this.storage.set(key, {
      value: encrypted,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        accessCount: 0
      }
    });
  }
  
  async retrieve(key, context) {
    const stored = this.storage.get(key);
    if (!stored) {
      throw new Error(`Secret not found: ${key}`);
    }
    
    // Increment access count for auditing
    stored.metadata.accessCount++;
    stored.metadata.lastAccessed = new Date().toISOString();
    stored.metadata.lastAccessedBy = context.user || 'system';
    
    return await this.encryption.decrypt(stored.value);
  }
}
```

### Code Scanning for Secrets

Implement automated secret detection:

```javascript
async scanForSecrets(code) {
  const secretPatterns = [
    {
      name: 'AWS Access Key',
      regex: /AKIA[0-9A-Z]{16}/g,
      severity: 'high'
    },
    {
      name: 'GitHub Token',
      regex: /ghp_[a-zA-Z0-9]{36}/g,
      severity: 'high'
    },
    {
      name: 'Private Key',
      regex: /-----BEGIN (RSA )?PRIVATE KEY-----/g,
      severity: 'critical'
    },
    {
      name: 'API Key Pattern',
      regex: /api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9]{20,}/gi,
      severity: 'medium'
    },
    {
      name: 'Database Connection',
      regex: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^\/]+/gi,
      severity: 'high'
    }
  ];
  
  const findings = [];
  
  for (const pattern of secretPatterns) {
    const matches = [...code.matchAll(pattern.regex)];
    
    for (const match of matches) {
      findings.push({
        type: pattern.name,
        severity: pattern.severity,
        match: match[0],
        position: match.index,
        line: this.getLineNumber(code, match.index),
        recommendation: this.getRecommendation(pattern.name)
      });
    }
  }
  
  return findings;
}

getRecommendation(secretType) {
  const recommendations = {
    'AWS Access Key': 'Move to environment variables and rotate immediately',
    'GitHub Token': 'Use GitHub Secrets and revoke this token',
    'Private Key': 'Store in secure key management system',
    'API Key Pattern': 'Move to environment variables or secure vault',
    'Database Connection': 'Use environment variables with proper escaping'
  };
  
  return recommendations[secretType] || 'Review and secure this credential';
}
```

## Safe Command Execution

### Sandboxed Execution

Implement command sandboxing for safety:

```javascript
class SafeCommandExecutor {
  constructor() {
    this.sandbox = new CommandSandbox();
    this.validator = new CommandValidator();
  }
  
  async safeExecute(command, options = {}) {
    // Pre-execution validation
    const validation = await this.validator.validate(command);
    if (!validation.safe) {
      throw new SecurityError(`Unsafe command: ${validation.reason}`);
    }
    
    // Execute in sandbox
    const sandboxOptions = {
      timeout: options.timeout || 30000,
      maxMemory: options.maxMemory || '512M',
      allowNetwork: options.allowNetwork || false,
      allowFileWrite: options.allowFileWrite || false,
      workingDirectory: options.workingDirectory || process.cwd()
    };
    
    return await this.sandbox.execute(command, sandboxOptions);
  }
}

class CommandValidator {
  constructor() {
    this.dangerousCommands = [
      'rm -rf',
      'sudo',
      'chmod 777',
      'dd if=',
      'mkfs',
      'fdisk',
      ':(){ :|:& };:', // Fork bomb
      'curl | sh',
      'wget | sh'
    ];
    
    this.suspiciousPatterns = [
      /curl.*\|.*sh/,
      /wget.*\|.*sh/,
      /eval.*\$\(/,
      /base64.*decode/,
      /nc.*-l.*-p/, // Netcat listener
      /python.*-c.*exec/
    ];
  }
  
  async validate(command) {
    // Check for dangerous commands
    for (const dangerous of this.dangerousCommands) {
      if (command.includes(dangerous)) {
        return {
          safe: false,
          reason: `Contains dangerous command: ${dangerous}`,
          severity: 'critical'
        };
      }
    }
    
    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(command)) {
        return {
          safe: false,
          reason: `Matches suspicious pattern: ${pattern.source}`,
          severity: 'high'
        };
      }
    }
    
    // Check command length (prevent buffer overflow attempts)
    if (command.length > 10000) {
      return {
        safe: false,
        reason: 'Command too long',
        severity: 'medium'
      };
    }
    
    // Additional checks based on command type
    return await this.validateSpecificCommand(command);
  }
  
  async validateSpecificCommand(command) {
    if (command.startsWith('git')) {
      return this.validateGitCommand(command);
    }
    
    if (command.startsWith('npm')) {
      return this.validateNpmCommand(command);
    }
    
    if (command.startsWith('docker')) {
      return this.validateDockerCommand(command);
    }
    
    return { safe: true };
  }
  
  validateGitCommand(command) {
    const allowedGitCommands = [
      'git status',
      'git add',
      'git commit',
      'git push',
      'git pull',
      'git branch',
      'git checkout',
      'git diff',
      'git log',
      'git stash'
    ];
    
    const isAllowed = allowedGitCommands.some(allowed => 
      command.startsWith(allowed)
    );
    
    if (!isAllowed) {
      return {
        safe: false,
        reason: `Git command not in allowlist: ${command}`,
        severity: 'medium'
      };
    }
    
    return { safe: true };
  }
}

class CommandSandbox {
  async execute(command, options) {
    const { spawn } = require('child_process');
    const { promisify } = require('util');
    
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        cwd: options.workingDirectory,
        env: this.getSafeEnvironment(options),
        timeout: options.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            stdout: this.sanitizeOutput(stdout),
            stderr: this.sanitizeOutput(stderr),
            exitCode: code
          });
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`Command execution error: ${error.message}`));
      });
      
      // Set up timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
          reject(new Error('Command timeout'));
        }
      }, options.timeout);
    });
  }
  
  getSafeEnvironment(options) {
    // Create minimal, safe environment
    const safeEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
      NODE_ENV: 'development'
    };
    
    // Remove potentially dangerous environment variables
    delete safeEnv.SSH_AUTH_SOCK;
    delete safeEnv.AWS_ACCESS_KEY_ID;
    delete safeEnv.AWS_SECRET_ACCESS_KEY;
    
    return safeEnv;
  }
  
  sanitizeOutput(output) {
    // Remove any potential secrets from output
    const secretPatterns = [
      /password[=:]\s*\S+/gi,
      /token[=:]\s*\S+/gi,
      /key[=:]\s*\S+/gi
    ];
    
    let sanitized = output;
    for (const pattern of secretPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    return sanitized;
  }
}
```

## Network Security

### API Request Validation

Secure external API interactions:

```javascript
class SecureAPIClient {
  constructor() {
    this.allowedDomains = new Set([
      'api.github.com',
      'registry.npmjs.org',
      'api.sentry.io',
      'hooks.slack.com'
    ]);
    
    this.rateLimiter = new Map();
  }
  
  async makeRequest(url, options = {}) {
    // Validate URL
    await this.validateURL(url);
    
    // Check rate limits
    await this.checkRateLimit(new URL(url).hostname);
    
    // Add security headers
    const secureOptions = {
      ...options,
      headers: {
        ...options.headers,
        'User-Agent': 'ClaudeCode/1.0 (Security-Enhanced)',
        'X-Requested-With': 'ClaudeCode'
      },
      timeout: options.timeout || 30000
    };
    
    // Remove sensitive headers for logging
    const logOptions = this.sanitizeOptionsForLogging(secureOptions);
    console.log(`Making API request to ${url}`, logOptions);
    
    try {
      const response = await fetch(url, secureOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }
  
  async validateURL(url) {
    const parsedURL = new URL(url);
    
    // Check protocol
    if (!['https:', 'http:'].includes(parsedURL.protocol)) {
      throw new SecurityError(`Invalid protocol: ${parsedURL.protocol}`);
    }
    
    // Check domain allowlist
    if (!this.allowedDomains.has(parsedURL.hostname)) {
      throw new SecurityError(`Domain not allowed: ${parsedURL.hostname}`);
    }
    
    // Check for suspicious paths
    const suspiciousPaths = [
      '/admin',
      '/config',
      '/secrets',
      '/.env',
      '/../../'
    ];
    
    for (const suspicious of suspiciousPaths) {
      if (parsedURL.pathname.includes(suspicious)) {
        throw new SecurityError(`Suspicious path: ${parsedURL.pathname}`);
      }
    }
  }
  
  async checkRateLimit(hostname) {
    const now = Date.now();
    const limit = this.rateLimiter.get(hostname) || { count: 0, reset: now + 60000 };
    
    if (now > limit.reset) {
      // Reset the limit
      this.rateLimiter.set(hostname, { count: 1, reset: now + 60000 });
    } else if (limit.count >= 100) { // 100 requests per minute
      throw new Error(`Rate limit exceeded for ${hostname}`);
    } else {
      limit.count++;
      this.rateLimiter.set(hostname, limit);
    }
  }
  
  sanitizeOptionsForLogging(options) {
    const sanitized = { ...options };
    
    // Remove sensitive headers
    if (sanitized.headers) {
      const headers = { ...sanitized.headers };
      
      for (const header in headers) {
        if (header.toLowerCase().includes('auth') || 
            header.toLowerCase().includes('token') ||
            header.toLowerCase().includes('key')) {
          headers[header] = '[REDACTED]';
        }
      }
      
      sanitized.headers = headers;
    }
    
    return sanitized;
  }
}
```

## Audit and Monitoring

### Comprehensive Audit Logging

Track all security-relevant events:

```javascript
class SecurityAuditLogger {
  constructor() {
    this.logFile = './logs/security-audit.jsonl';
    this.alertThresholds = {
      failedCommands: 5,
      timeWindow: 300000 // 5 minutes
    };
    this.recentEvents = [];
  }
  
  async logSecurityEvent(event) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity || 'info',
      user: event.user || 'system',
      command: event.command ? this.sanitizeCommand(event.command) : null,
      result: event.result || null,
      metadata: event.metadata || {},
      sessionId: event.sessionId || null
    };
    
    // Add to recent events for pattern analysis
    this.recentEvents.push(auditEntry);
    this.cleanupOldEvents();
    
    // Write to audit log
    await this.writeAuditEntry(auditEntry);
    
    // Check for security alerts
    await this.checkSecurityAlerts(auditEntry);
  }
  
  async logCommandExecution(command, result, context) {
    await this.logSecurityEvent({
      type: 'command_execution',
      severity: result.success ? 'info' : 'warning',
      user: context.user,
      command: command,
      result: {
        success: result.success,
        exitCode: result.exitCode,
        duration: result.duration
      },
      metadata: {
        workingDirectory: context.workingDirectory,
        environment: context.environment
      },
      sessionId: context.sessionId
    });
  }
  
  async logPermissionDenial(permission, context) {
    await this.logSecurityEvent({
      type: 'permission_denied',
      severity: 'warning',
      user: context.user,
      metadata: {
        permission: permission,
        context: context
      },
      sessionId: context.sessionId
    });
  }
  
  async logSecretAccess(secretKey, context) {
    await this.logSecurityEvent({
      type: 'secret_access',
      severity: 'info',
      user: context.user,
      metadata: {
        secretKey: secretKey,
        purpose: context.purpose
      },
      sessionId: context.sessionId
    });
  }
  
  async checkSecurityAlerts(event) {
    // Check for multiple failed commands in short time
    const recentFailures = this.recentEvents.filter(e => 
      e.type === 'command_execution' && 
      !e.result?.success &&
      Date.now() - new Date(e.timestamp).getTime() < this.alertThresholds.timeWindow
    );
    
    if (recentFailures.length >= this.alertThresholds.failedCommands) {
      await this.triggerSecurityAlert({
        type: 'multiple_command_failures',
        severity: 'high',
        count: recentFailures.length,
        timeWindow: this.alertThresholds.timeWindow,
        events: recentFailures
      });
    }
    
    // Check for suspicious patterns
    await this.checkSuspiciousPatterns(event);
  }
  
  async checkSuspiciousPatterns(event) {
    const suspiciousPatterns = [
      {
        name: 'privilege_escalation_attempt',
        condition: (e) => e.command?.includes('sudo') || e.command?.includes('su '),
        severity: 'critical'
      },
      {
        name: 'secret_scanning_attempt',
        condition: (e) => e.command?.includes('grep') && 
                          (e.command?.includes('password') || e.command?.includes('key')),
        severity: 'high'
      },
      {
        name: 'network_scanning',
        condition: (e) => e.command?.includes('nmap') || e.command?.includes('nc '),
        severity: 'high'
      }
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.condition(event)) {
        await this.triggerSecurityAlert({
          type: pattern.name,
          severity: pattern.severity,
          triggerEvent: event
        });
      }
    }
  }
  
  async triggerSecurityAlert(alert) {
    const alertEntry = {
      timestamp: new Date().toISOString(),
      type: 'security_alert',
      severity: alert.severity,
      alert: alert
    };
    
    await this.writeAuditEntry(alertEntry);
    
    // Send notifications for high/critical alerts
    if (['high', 'critical'].includes(alert.severity)) {
      await this.sendSecurityNotification(alert);
    }
  }
  
  async sendSecurityNotification(alert) {
    // Implementation would depend on your notification system
    console.error(`SECURITY ALERT [${alert.severity.toUpperCase()}]: ${alert.type}`);
    
    // Example: Send to Slack, email, or monitoring system
    // await this.notificationService.send({
    //   channel: '#security-alerts',
    //   message: `Security Alert: ${alert.type}`,
    //   severity: alert.severity,
    //   details: alert
    // });
  }
  
  sanitizeCommand(command) {
    // Remove potential secrets from command strings
    const secretPatterns = [
      /--password[=\s]+\S+/gi,
      /--token[=\s]+\S+/gi,
      /--key[=\s]+\S+/gi,
      /-p\s+\S+/gi // Common password flag
    ];
    
    let sanitized = command;
    for (const pattern of secretPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    return sanitized;
  }
  
  cleanupOldEvents() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.recentEvents = this.recentEvents.filter(event => 
      new Date(event.timestamp).getTime() > cutoff
    );
  }
  
  async writeAuditEntry(entry) {
    const fs = require('fs').promises;
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.logFile, line);
  }
}
```

## Security Best Practices

### Development Guidelines

1. **Principle of Least Privilege**: Grant minimal permissions required
2. **Defense in Depth**: Multiple security layers
3. **Fail Secure**: Default to secure state on errors
4. **Audit Everything**: Log all security-relevant events
5. **Regular Review**: Periodic security audits

### Configuration Template

```json
{
  "security": {
    "version": "1.0",
    "mode": "strict",
    "permissions": {
      "filesystem": {
        "read": ["./src/**", "./tests/**", "./docs/**"],
        "write": ["./src/**", "./tests/**"],
        "forbidden": ["./secrets/**", "./.env*", "./private/**"]
      },
      "network": {
        "mode": "allowlist",
        "allowed_domains": ["api.github.com", "registry.npmjs.org"],
        "max_requests_per_minute": 100
      },
      "commands": {
        "mode": "allowlist",
        "allowed": ["git", "npm", "node", "test"],
        "forbidden": ["sudo", "rm -rf", "chmod 777"]
      }
    },
    "audit": {
      "enabled": true,
      "log_file": "./logs/security-audit.jsonl",
      "alert_webhook": "https://hooks.slack.com/your-webhook"
    },
    "secrets": {
      "scan_code": true,
      "scan_commits": true,
      "vault_enabled": true
    }
  }
}
```

Security in autonomous development requires constant vigilance and robust systems. These patterns ensure Claude Code operates safely while maintaining the flexibility needed for effective development workflows.