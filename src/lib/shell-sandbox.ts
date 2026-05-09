// Shell Command Sandbox - Security Layer
// Allows safe commands with strict validation - expanded for Ubuntu terminal

const ALLOWED_COMMANDS = [
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
  // System info
  'date', 'uptime', 'whoami', 'uname', 'hostname', 'env', 'which',
  'free', 'top', 'htop',
  // Process info
  'ps', 'pm2',
  // Docker (safe subset)
  'docker',
  // Custom AI commands
  'ai-status', 'ai-deploy', 'ai-ssl',
  // Help
  'help',
  // Additional safe commands for Ubuntu terminal
  'id', 'groups', 'last', 'w', 'who', 'mesg',
  'cal', 'bc', 'expr',
  'diff', 'cmp', 'comm',
  'xargs', 'tee',
  'ln', 'readlink', 'realpath', 'basename', 'dirname',
  'touch', 'mkdir', 'cp', 'mv',
  'tar', 'gzip', 'gunzip', 'zip', 'unzip',
  'openssl',
  'ss', 'netstat', 'ip',
  'journalctl',
  'lsblk', 'mount', 'fdisk',
];

const BLOCKED_PATTERNS = [
  // Dangerous commands
  /rm\s+-rf\s+\//i, /rm\s+-rf\s+~/i, /rm\s+-rf\s+\*/i,
  /\bsudo\b/i, /\bsu\b/i, /\bpasswd\b/i,
  /\bchmod\s+777/i, /\bchown\b/i,
  /\bdd\s+if=/i, /\bmkfs\b/i, /\bfdisk\b/i,
  /\bshutdown\b/i, /\breboot\b/i, /\binit\s+[06]/i,
  /\biptables\b/i, /\bnetfilter\b/i,
  /\bcrontab\b/i, /\bat\s+/i,
  // Piping to shell
  /\|\s*(sh|bash|zsh|dash)/i,
  />\s*\/etc\//i, />\s*\/root\//i,
  // Download and execute
  /curl.*\|.*sh/i, /wget.*\|.*sh/i,
  // Fork bombs
  /:\(\)\{\s*:\|:&\s*\}/,
  // Reverse shells
  /\/dev\/tcp\//i, /nc\s+-.*-e/i, /\bncat\b/i,
  // System modification
  /\bapt\b/i, /\byum\b/i, /\bdpkg\b/i, /\bsnap\b/i,
  /\bsystemctl\b/i, /\bservice\b/i,
  // Credential access
  /\/etc\/shadow/i, /\/etc\/passwd/i, /\.ssh\//i,
  // Dangerous redirects
  />\s*\/dev\//i,
  // rm with force on important dirs
  /\brm\s+.*-.*f.*\s+\//i,
];

const DANGEROUS_ENV_VARS = ['JWT_SECRET', 'SMTP_PASS', 'DATABASE_URL', 'BKASH_API_KEY', 'BKASH_API_SECRET'];

export interface ShellValidationResult {
  safe: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sanitized?: string;
}

export function validateShellCommand(command: string): ShellValidationResult {
  if (!command || typeof command !== 'string') {
    return { safe: false, reason: 'Empty command', riskLevel: 'low' };
  }

  const trimmed = command.trim();

  // Check length limit
  if (trimmed.length > 500) {
    return { safe: false, reason: 'Command too long (max 500 characters)', riskLevel: 'medium' };
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: `Command contains blocked pattern: ${pattern.source}`, riskLevel: 'critical' };
    }
  }

  // Check for environment variable access
  for (const envVar of DANGEROUS_ENV_VARS) {
    if (trimmed.includes(envVar)) {
      return { safe: false, reason: `Access to sensitive environment variable: ${envVar}`, riskLevel: 'critical' };
    }
  }

  // Check for path traversal (except in find)
  if (/\.\.\//.test(trimmed) && !/find\s/.test(trimmed)) {
    return { safe: false, reason: 'Path traversal detected', riskLevel: 'high' };
  }

  // Check for dangerous command chaining
  if (/;\s*(rm|sudo|chmod|chown|dd|shutdown|reboot)/i.test(trimmed)) {
    return { safe: false, reason: 'Dangerous command chaining detected', riskLevel: 'critical' };
  }

  // Check for backtick/subshell execution
  if (/`.*`/.test(trimmed) || /\$\(.*\)/.test(trimmed)) {
    const subshellContent = trimmed.match(/\$\((.*?)\)/g);
    if (subshellContent) {
      for (const sub of subshellContent) {
        const inner = sub.slice(2, -1);
        const innerResult = validateShellCommand(inner);
        if (!innerResult.safe) return innerResult;
      }
    }
  }

  // Extract the base command
  const baseCommand = trimmed.split(/\s+/)[0].replace(/^\//, '');
  const fullBaseCommand = trimmed.split(/[\s|;&]/)[0].replace(/^\//, '');

  // Check if base command is in allowed list (or starts with an allowed command)
  const isAllowed = ALLOWED_COMMANDS.some(allowed => {
    return baseCommand === allowed || fullBaseCommand === allowed || trimmed.startsWith(allowed + ' ');
  });

  if (!isAllowed) {
    return { safe: false, reason: `Command not in allowed list: ${baseCommand}`, riskLevel: 'high' };
  }

  return { safe: true, riskLevel: 'low', sanitized: trimmed };
}

export function getSandboxEnv(userId: string): Record<string, string> {
  const homeDir = `/home/fahad/hosting/users/${userId}`;
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

export function getSandboxCwd(userId: string): string {
  return `/home/fahad/hosting/users/${userId}`;
}
