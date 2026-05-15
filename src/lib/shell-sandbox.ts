// Shell Command Sandbox - Security Layer with Role-Based Access
// Admin: Full server access | Users: Restricted to their own area only
// v2.0 - Hardened with injection detection, argument limits, pipebomb detection

import { appConfig } from '@/lib/config/app.config';

// ===================== SECURITY LIMITS =====================

/** Maximum command length in characters */
const MAX_COMMAND_LENGTH = 1000;

/** Maximum number of arguments in a single command */
const MAX_ARGUMENT_COUNT = 50;

/** Maximum number of pipe/chaining operators */
const MAX_PIPE_COUNT = 5;

/** Default command timeout in seconds for sandbox execution */
const DEFAULT_COMMAND_TIMEOUT = 30;

// ===================== ALLOWED COMMANDS =====================

const ALLOWED_COMMANDS_USER = [
  // File operations (read-only)
  'ls', 'cat', 'head', 'tail', 'wc', 'find', 'file', 'stat', 'du', 'df',
  // Directory navigation
  'pwd', 'cd', 'tree',
  // Text processing
  'grep', 'awk', 'sed', 'sort', 'uniq', 'cut', 'tr', 'echo', 'printf',
  // Network diagnostics
  'ping', 'curl', 'wget', 'nslookup', 'dig', 'whois', 'host', 'traceroute',
  // Development
  'node', 'npm', 'npx', 'git', 'python3', 'pip3', 'bun',
  // System info (read-only)
  'date', 'uptime', 'whoami', 'uname', 'hostname', 'which',
  'free', 'top', 'htop',
  // Process info (own only)
  'ps', 'pm2',
  // Docker (safe read-only subset)
  'docker',
  // Custom AI commands
  'ai-status', 'ai-deploy', 'ai-ssl',
  // Help
  'help',
  // Additional safe commands
  'id', 'groups', 'cal', 'bc', 'expr',
  'diff', 'cmp', 'comm', 'xargs', 'tee',
  'ln', 'readlink', 'realpath', 'basename', 'dirname',
  'touch', 'mkdir', 'cp', 'mv',
  'tar', 'gzip', 'gunzip', 'zip', 'unzip',
  'openssl',
  'ss', 'netstat', 'ip',
];

const ALLOWED_COMMANDS_ADMIN = [
  // ALL user commands plus admin-only commands
  ...ALLOWED_COMMANDS_USER,
  // System administration
  'sudo', 'su', 'systemctl', 'service', 'journalctl',
  'apt', 'apt-get', 'yum', 'dpkg', 'snap',
  // User management
  'useradd', 'userdel', 'usermod', 'passwd', 'groupadd', 'groupdel',
  'chown', 'chmod',
  // Advanced system
  'fdisk', 'lsblk', 'mount', 'umount', 'mkfs',
  'iptables', 'ufw', 'netfilter',
  'crontab', 'at',
  'shutdown', 'reboot', 'init',
  'env',
  'last', 'w', 'who', 'mesg',
  // Docker management (full)
  'docker-compose', 'docker',
  // Nginx/Apache
  'nginx', 'apache2', 'httpd',
  // Process management
  'kill', 'killall', 'pkill', 'nohup',
  // Advanced tools
  'strace', 'lsof', 'nc', 'ncat', 'telnet',
  'scp', 'rsync', 'ssh',
];

// ===================== BLOCKED PATTERNS =====================

const BLOCKED_PATTERNS_USER = [
  // Dangerous commands
  /rm\s+-rf\s+\//i, /rm\s+-rf\s+~/i, /rm\s+-rf\s+\*/i,
  /\bsudo\b/i, /\bsu\b/i, /\bpasswd\b/i,
  /\bchmod\s+777/i, /\bchown\b/i,
  /\bdd\s+if=/i, /\bmkfs\b/i, /\bfdisk\b/i,
  /\bshutdown\b/i, /\breboot\b/i, /\binit\s+[06]/i,
  /\biptables\b/i, /\bnetfilter\b/i,
  /\bcrontab\b/i, /\bat\s+/i,
  // Piping to shell (command injection)
  /\|\s*(sh|bash|zsh|dash|ksh|csh|tcsh)/i,
  // Redirecting to critical system files
  />\s*\/etc\//i, />\s*\/root\//i,
  // Download and execute patterns
  /curl.*\|.*sh/i, /wget.*\|.*sh/i,
  /curl.*\|.*bash/i, /wget.*\|.*bash/i,
  /curl.*\|.*exec/i, /wget.*\|.*exec/i,
  // Fork bombs - classic and variations
  /:\(\)\{\s*:\|:&\s*\}/,                          // :(){ :|:& }
  /\bfork\s*\(\)/i,                                  // fork()
  /\bwhile\s+true\s*;\s*do/i,                       // while true; do
  /\bfor\s*\(\s*;\s*;\s*\)/i,                        // for(;;)
  // Reverse shells
  /\/dev\/tcp\//i, /nc\s+-.*-e/i, /\bncat\b.*-e/i,
  /bash\s+-i\s*>&/i, /sh\s+-i\s*>&/i,
  /\bpython\b.*socket.*connect/i,
  /\bperl\b.*socket.*connect/i,
  /\bruby\b.*socket.*connect/i,
  /\bnc\b.*-e\s+\/bin\/(sh|bash)/i,
  // System modification
  /\bapt\b/i, /\byum\b/i, /\bdpkg\b/i, /\bsnap\b/i,
  /\bsystemctl\b/i, /\bservice\b/i,
  // Credential access
  /\/etc\/shadow/i, /\/etc\/passwd/i, /\.ssh\//i,
  /\/\.ssh\//i, /id_rsa/i, /id_ed25519/i, /authorized_keys/i,
  // Dangerous redirects
  />\s*\/dev\//i,
  // rm with force on important dirs
  /\brm\s+.*-.*f.*\s+\//i,
  // Prevent users from accessing other users' directories
  new RegExp(`/${escapeRegex(appConfig.hosting.usersDir)}/(?!__SELF__)`.replace(/\/\//g, '/')),
  // Prevent access to project source
  new RegExp(escapeRegex(appConfig.projectRoot), 'i'),
  // Prevent access to root
  /\/root\//i,
  // Prevent access to other system dirs
  /\/var\/log\//i, /\/var\/lib\//i, /\/etc\//i,
  // Command substitution injection
  /\$\(\s*\(/i,                                       // $(( - arithmetic but could be abuse
  // Null byte injection
  /\\x00/i, /%00/i,
  // Hex/octal escape injection
  /\\x[0-9a-fA-F]{2}/, /\\[0-7]{3}/,
  // Unicode escape tricks
  /\\u[0-9a-fA-F]{4}/i,
  // Process substitution
  /<\(/i,                                              // <(command) process substitution
  // HERE document abuse
  /<<\s*['"]*EOF/i,
  // eval injection
  /\beval\s+/i,
  // exec injection
  /\bexec\s+/i,
  // Source/dot injection
  /\bsource\s+/i, /^\.\s+\//i,
  // Environment variable exfiltration
  /\benv\b.*\bprint/i, /\bprintenv\b/i, /\bexport\b.*\bpasswd/i,
  // Base64 decode pipe (common obfuscation)
  /\bbase64\b.*\|/i, /\bopenssl\b.*enc.*\|/i,
  // Named pipe abuse
  /\bmknod\b/i, /\bmkfifo\b/i,
];

const BLOCKED_PATTERNS_ADMIN = [
  // Even admins can't do these extremely dangerous things
  /rm\s+-rf\s+\//i, /rm\s+-rf\s+\*/i,
  /rm\s+-rf\s+\/\w/i,
  // Fork bombs
  /:\(\)\{\s*:\|:&\s*\}/,
  /\bfork\s*\(\)/i,
  /\bwhile\s+true\s*;\s*do/i,
  // Download and execute
  /curl.*\|.*sh/i, /wget.*\|.*sh/i,
  /curl.*\|.*bash/i, /wget.*\|.*bash/i,
  // Reverse shell patterns
  /\/dev\/tcp\//i,
  /\bnc\b.*-e\s+\/bin\/(sh|bash)/i,
  /\bncat\b.*-e\s+\/bin\/(sh|bash)/i,
  /bash\s+-i\s*>&/i,
  // Base64 decode pipe (obfuscation)
  /\bbase64\b.*\|(?!.*less|.*more|.*head|.*tail)/i,
  // Null byte injection
  /\\x00/i, /%00/i,
  // Process substitution to dangerous targets
  /<\(.*(?:rm|dd|mkfs|format)/i,
];

const DANGEROUS_ENV_VARS = [
  'JWT_SECRET', 'SMTP_PASS', 'DATABASE_URL',
  'BKASH_API_KEY', 'BKASH_API_SECRET',
  'REDIS_URL', 'QDRANT_URL',
  'AWS_SECRET_ACCESS_KEY', 'AWS_ACCESS_KEY_ID',
];

// ===================== TYPES =====================

export interface ShellValidationResult {
  safe: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sanitized?: string;
  restrictedToUserDir?: boolean;
  timeout?: number;
}

// ===================== HELPERS =====================

/** Escape a string for use in a RegExp */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Count pipe/chaining operators in a command */
function countPipeOperators(cmd: string): number {
  const matches = cmd.match(/\||&&|\|\||;/g);
  return matches ? matches.length : 0;
}

/** Count arguments in a command (rough estimate) */
function countArguments(cmd: string): number {
  // Split by whitespace, excluding quoted strings
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const ch of cmd) {
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (/\s/.test(ch)) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  return parts.length;
}

// ===================== VALIDATION =====================

export function validateShellCommand(command: string, isAdmin: boolean = false, userId?: string): ShellValidationResult {
  if (!command || typeof command !== 'string') {
    return { safe: false, reason: 'Empty command', riskLevel: 'low' };
  }

  const trimmed = command.trim();

  // 1. Check length limit
  if (trimmed.length > MAX_COMMAND_LENGTH) {
    return { safe: false, reason: `Command too long (max ${MAX_COMMAND_LENGTH} characters)`, riskLevel: 'medium' };
  }

  // 2. Check argument count limit
  const argCount = countArguments(trimmed);
  if (argCount > MAX_ARGUMENT_COUNT) {
    return { safe: false, reason: `Too many arguments (max ${MAX_ARGUMENT_COUNT})`, riskLevel: 'medium' };
  }

  // 3. Check pipe/chaining operator count (pipebomb detection)
  const pipeCount = countPipeOperators(trimmed);
  if (pipeCount > MAX_PIPE_COUNT) {
    return { safe: false, reason: `Too many pipe/chain operators (max ${MAX_PIPE_COUNT})`, riskLevel: 'high' };
  }

  // 4. Check for null bytes (injection attempt)
  if (trimmed.includes('\0')) {
    return { safe: false, reason: 'Null byte detected in command', riskLevel: 'critical' };
  }

  // 5. Check for control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) {
    return { safe: false, reason: 'Control characters detected in command', riskLevel: 'critical' };
  }

  const blockedPatterns = isAdmin ? BLOCKED_PATTERNS_ADMIN : BLOCKED_PATTERNS_USER;
  const allowedCommands = isAdmin ? ALLOWED_COMMANDS_ADMIN : ALLOWED_COMMANDS_USER;

  // 6. For non-admin users, replace __SELF__ placeholder with actual userId in path restriction
  let processedCommand = trimmed;
  if (!isAdmin && userId) {
    // Check if user is trying to access another user's directory
    const userDirBase = appConfig.hosting.usersDir;
    const otherUserDirPattern = new RegExp(`${escapeRegex(userDirBase)}/([^/]+)`);
    const match = processedCommand.match(otherUserDirPattern);
    if (match && match[1] !== userId) {
      return { safe: false, reason: 'Access denied: Cannot access other users\' directories', riskLevel: 'high' };
    }
  }

  // 7. Check for blocked patterns
  for (const pattern of blockedPatterns) {
    // Skip the __SELF__ pattern (handled above)
    if (pattern.source.includes('__SELF__')) continue;
    try {
      if (pattern.test(processedCommand)) {
        return { safe: false, reason: `Command contains blocked pattern`, riskLevel: 'critical' };
      }
    } catch {
      // Invalid regex pattern, skip it
      continue;
    }
  }

  // 8. Check for environment variable access
  for (const envVar of DANGEROUS_ENV_VARS) {
    if (processedCommand.includes(envVar)) {
      return { safe: false, reason: `Access to sensitive environment variable: ${envVar}`, riskLevel: 'critical' };
    }
  }

  // 9. For non-admin users, check for path traversal
  if (!isAdmin) {
    if (/\.\.\//.test(processedCommand) && !/find\s/.test(processedCommand)) {
      return { safe: false, reason: 'Path traversal detected', riskLevel: 'high' };
    }

    // Check for dangerous command chaining
    if (/;\s*(rm|sudo|chmod|chown|dd|shutdown|reboot|mkfs|fdisk)/i.test(processedCommand)) {
      return { safe: false, reason: 'Dangerous command chaining detected', riskLevel: 'critical' };
    }

    // Check for && chaining to dangerous commands
    if (/&&\s*(rm|sudo|chmod|chown|dd|shutdown|reboot|mkfs|fdisk)/i.test(processedCommand)) {
      return { safe: false, reason: 'Dangerous command chaining detected', riskLevel: 'critical' };
    }
  }

  // 10. Enhanced subshell detection
  // Backtick subshell
  if (/`[^`]*`/.test(processedCommand)) {
    const backtickContent = processedCommand.match(/`([^`]*)`/g);
    if (backtickContent) {
      for (const sub of backtickContent) {
        const inner = sub.slice(1, -1);
        const innerResult = validateShellCommand(inner, isAdmin, userId);
        if (!innerResult.safe) return innerResult;
      }
    }
  }

  // $(...) subshell - recursive validation
  const subshellMatches = processedCommand.match(/\$\(([^()]*(?:\([^()]*\))*[^()]*)\)/g);
  if (subshellMatches) {
    for (const sub of subshellMatches) {
      const inner = sub.slice(2, -1);
      const innerResult = validateShellCommand(inner, isAdmin, userId);
      if (!innerResult.safe) return innerResult;
    }
  }

  // 11. Detect nested subshell attempts $($(...))
  if (/\$\$\(/.test(processedCommand) || /\$\(\$\(/.test(processedCommand)) {
    return { safe: false, reason: 'Nested subshell execution detected', riskLevel: 'critical' };
  }

  // 12. Extract the base command
  const baseCommand = processedCommand.split(/\s+/)[0]?.replace(/^\//, '') || '';
  const fullBaseCommand = processedCommand.split(/[\s|;&]/)[0]?.replace(/^\//, '') || '';

  // 13. Check if base command is in allowed list
  const isAllowed = allowedCommands.some(allowed => {
    return baseCommand === allowed || fullBaseCommand === allowed || processedCommand.startsWith(allowed + ' ');
  });

  if (!isAllowed) {
    return { safe: false, reason: `Command not in allowed list: ${baseCommand}`, riskLevel: 'high' };
  }

  // 14. For non-admin users, restrict rm command to user's own directory only
  if (!isAdmin && /\brm\b/.test(processedCommand)) {
    return { safe: true, riskLevel: 'medium', sanitized: processedCommand, restrictedToUserDir: true, timeout: DEFAULT_COMMAND_TIMEOUT };
  }

  return { safe: true, riskLevel: isAdmin ? 'low' : 'low', sanitized: processedCommand, restrictedToUserDir: !isAdmin, timeout: DEFAULT_COMMAND_TIMEOUT };
}

// ===================== SANDBOX ENVIRONMENT =====================

export function getSandboxEnv(userId: string, isAdmin: boolean = false): Record<string, string> {
  if (isAdmin) {
    return {
      HOME: appConfig.hosting.baseDir,
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      NODE_ENV: 'production',
      USER: 'fahad',
      SHELL: '/bin/bash',
      EDITOR: 'nano',
    };
  }
  
  const homeDir = `${appConfig.hosting.usersDir}/${userId}`;
  return {
    HOME: homeDir,
    PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
    NODE_ENV: 'production',
    USER: userId.substring(0, 8),
    SHELL: '/bin/bash',
    EDITOR: 'nano',
  };
}

export function getSandboxCwd(userId: string, isAdmin: boolean = false): string {
  if (isAdmin) {
    return appConfig.hosting.baseDir;
  }
  return `${appConfig.hosting.usersDir}/${userId}`;
}

// ===================== HELP TEXT =====================

export function getAdminHelpText(): string {
  return `FahadCloud Admin Terminal - Full Access Mode

System Admin:    sudo, systemctl, service, journalctl
User Management: useradd, userdel, usermod, passwd
Package Mgmt:    apt, apt-get, dpkg
Docker:          docker, docker-compose
Process Mgmt:    kill, killall, pkill, pm2
Network:         iptables, ufw, ss, netstat, ip
File System:     ls, cat, pwd, du, df, find, tree
Development:     node, npm, npx, git, python3
Server:          nginx, apache2, pm2
Security:        ufw, iptables, openssl

Admin has full server access. Use with caution.

Limits: Max ${MAX_COMMAND_LENGTH} chars, ${MAX_ARGUMENT_COUNT} args, ${MAX_PIPE_COUNT} pipes
Timeout: ${DEFAULT_COMMAND_TIMEOUT}s per command`;
}

export function getUserHelpText(): string {
  return `FahadCloud Ubuntu Terminal - Restricted Mode

System Info:     whoami, hostname, uname -a, uptime, date
Resource Usage:  df -h, free -m, top -bn1 | head -20
Processes:       ps aux, pm2 list
Docker (read):   docker ps, docker images, docker logs <container>
Files:           ls, cat, pwd, du -sh, find, tree
Network:         ping, curl, wget, nslookup, dig
Development:     node --version, npm --version, git status
AI Commands:     ai-status, ai-deploy, ai-ssl

You are restricted to your own hosting directory.
System-level commands are not available.

Limits: Max ${MAX_COMMAND_LENGTH} chars, ${MAX_ARGUMENT_COUNT} args, ${MAX_PIPE_COUNT} pipes
Timeout: ${DEFAULT_COMMAND_TIMEOUT}s per command`;
}
