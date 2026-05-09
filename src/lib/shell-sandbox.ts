// Shell Command Sandbox - Security Layer with Role-Based Access
// Admin: Full server access | Users: Restricted to their own area only

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

const BLOCKED_PATTERNS_USER = [
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
  // Prevent users from accessing other users' directories
  /\/home\/fahad\/hosting\/users\/(?!__SELF__)/,
  // Prevent access to project source
  /\/home\/fahad\/fahadcloud/i,
  // Prevent access to root
  /\/root\//i,
  // Prevent access to other system dirs
  /\/var\/log\//i, /\/var\/lib\//i, /\/etc\//i,
];

const BLOCKED_PATTERNS_ADMIN = [
  // Even admins can't do these extremely dangerous things
  /rm\s+-rf\s+\//i, /rm\s+-rf\s+\*/i,
  /:\(\)\{\s*:\|:&\s*\}/, // Fork bombs
  /curl.*\|.*sh/i, /wget.*\|.*sh/i, // Download and execute
  /\/dev\/tcp\//i, // Reverse shell
];

const DANGEROUS_ENV_VARS = ['JWT_SECRET', 'SMTP_PASS', 'DATABASE_URL', 'BKASH_API_KEY', 'BKASH_API_SECRET'];

export interface ShellValidationResult {
  safe: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sanitized?: string;
  restrictedToUserDir?: boolean;
}

export function validateShellCommand(command: string, isAdmin: boolean = false, userId?: string): ShellValidationResult {
  if (!command || typeof command !== 'string') {
    return { safe: false, reason: 'Empty command', riskLevel: 'low' };
  }

  const trimmed = command.trim();

  // Check length limit
  if (trimmed.length > 1000) {
    return { safe: false, reason: 'Command too long (max 1000 characters)', riskLevel: 'medium' };
  }

  const blockedPatterns = isAdmin ? BLOCKED_PATTERNS_ADMIN : BLOCKED_PATTERNS_USER;
  const allowedCommands = isAdmin ? ALLOWED_COMMANDS_ADMIN : ALLOWED_COMMANDS_USER;

  // For non-admin users, replace __SELF__ placeholder with actual userId in path restriction
  let processedCommand = trimmed;
  if (!isAdmin && userId) {
    // Check if user is trying to access another user's directory
    const otherUserDirPattern = /\/home\/fahad\/hosting\/users\/([^/]+)/;
    const match = processedCommand.match(otherUserDirPattern);
    if (match && match[1] !== userId) {
      return { safe: false, reason: 'Access denied: Cannot access other users\' directories', riskLevel: 'high' };
    }
  }

  // Check for blocked patterns
  for (const pattern of blockedPatterns) {
    // Skip the __SELF__ pattern (handled above)
    if (pattern.source.includes('__SELF__')) continue;
    if (pattern.test(processedCommand)) {
      return { safe: false, reason: `Command contains blocked pattern: ${pattern.source}`, riskLevel: 'critical' };
    }
  }

  // Check for environment variable access
  for (const envVar of DANGEROUS_ENV_VARS) {
    if (processedCommand.includes(envVar)) {
      return { safe: false, reason: `Access to sensitive environment variable: ${envVar}`, riskLevel: 'critical' };
    }
  }

  // For non-admin users, check for path traversal
  if (!isAdmin) {
    if (/\.\.\//.test(processedCommand) && !/find\s/.test(processedCommand)) {
      return { safe: false, reason: 'Path traversal detected', riskLevel: 'high' };
    }

    // Check for dangerous command chaining
    if (/;\s*(rm|sudo|chmod|chown|dd|shutdown|reboot)/i.test(processedCommand)) {
      return { safe: false, reason: 'Dangerous command chaining detected', riskLevel: 'critical' };
    }
  }

  // Check for backtick/subshell execution
  if (/`.*`/.test(processedCommand) || /\$\(.*\)/.test(processedCommand)) {
    const subshellContent = processedCommand.match(/\$\((.*?)\)/g);
    if (subshellContent) {
      for (const sub of subshellContent) {
        const inner = sub.slice(2, -1);
        const innerResult = validateShellCommand(inner, isAdmin, userId);
        if (!innerResult.safe) return innerResult;
      }
    }
  }

  // Extract the base command
  const baseCommand = processedCommand.split(/\s+/)[0].replace(/^\//, '');
  const fullBaseCommand = processedCommand.split(/[\s|;&]/)[0].replace(/^\//, '');

  // Check if base command is in allowed list
  const isAllowed = allowedCommands.some(allowed => {
    return baseCommand === allowed || fullBaseCommand === allowed || processedCommand.startsWith(allowed + ' ');
  });

  if (!isAllowed) {
    return { safe: false, reason: `Command not in allowed list: ${baseCommand}`, riskLevel: 'high' };
  }

  // For non-admin users, restrict rm command to user's own directory only
  if (!isAdmin && /\brm\b/.test(processedCommand)) {
    // rm is only allowed in the user's own hosting directory
    return { safe: true, riskLevel: 'medium', sanitized: processedCommand, restrictedToUserDir: true };
  }

  return { safe: true, riskLevel: isAdmin ? 'low' : 'low', sanitized: processedCommand, restrictedToUserDir: !isAdmin };
}

export function getSandboxEnv(userId: string, isAdmin: boolean = false): Record<string, string> {
  if (isAdmin) {
    // Admin gets full environment access
    return {
      HOME: '/home/fahad',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      NODE_ENV: 'production',
      USER: 'fahad',
      SHELL: '/bin/bash',
      EDITOR: 'nano',
    };
  }
  
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

export function getSandboxCwd(userId: string, isAdmin: boolean = false): string {
  if (isAdmin) {
    return '/home/fahad';
  }
  return `/home/fahad/hosting/users/${userId}`;
}

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

⚡ Admin has full server access. Use with caution.`;
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

📁 You are restricted to your own hosting directory.
⛔ System-level commands are not available.`;
}
