// Safe Shell Utilities - Secure command execution with audit logging
// Uses execFileSync/execFile instead of execSync to prevent shell injection
// All arguments are passed as arrays, never string-interpolated

import { execFileSync, execFile } from 'child_process';

/** Audit log entry for shell command execution */
export interface ShellAuditEntry {
  timestamp: string;
  command: string;
  args: string[];
  timeout: number;
  cwd?: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

/** In-memory audit trail (capped at last 1000 entries) */
const auditLog: ShellAuditEntry[] = [];
const MAX_AUDIT_ENTRIES = 1000;

function addAuditEntry(entry: ShellAuditEntry): void {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT_ENTRIES) {
    auditLog.shift();
  }
}

/** Get the audit log (read-only copy) */
export function getShellAuditLog(): readonly ShellAuditEntry[] {
  return auditLog;
}

/** Options for safe command execution */
export interface SafeExecOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Working directory */
  cwd?: string;
  /** Maximum buffer size in bytes (default: 1MB) */
  maxBuffer?: number;
  /** Environment variables to pass to the child process */
  env?: NodeJS.ProcessEnv;
  /** Whether to log this command to the audit trail (default: true) */
  audit?: boolean;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_BUFFER = 1024 * 1024; // 1MB

/**
 * Safely execute a command synchronously using execFileSync.
 * Arguments are passed as an array, preventing shell injection via string interpolation.
 * 
 * @example
 * // Instead of: execSync(`docker rm -f ${containerName}`)
 * // Use: safeExec('docker', ['rm', '-f', containerName])
 * 
 * @param command - The command to execute (no shell metacharacters interpreted)
 * @param args - Arguments passed as an array (each element is a separate argument)
 * @param options - Execution options
 * @returns The stdout output as a string
 * @throws Error if the command fails
 */
export function safeExec(command: string, args: string[], options?: SafeExecOptions): string {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxBuffer = options?.maxBuffer ?? DEFAULT_MAX_BUFFER;
  const shouldAudit = options?.audit !== false;
  const startTime = Date.now();

  try {
    const result = execFileSync(command, args, {
      encoding: 'utf-8',
      timeout,
      maxBuffer,
      cwd: options?.cwd,
      env: options?.env as NodeJS.ProcessEnv,
    });

    if (shouldAudit) {
      addAuditEntry({
        timestamp: new Date().toISOString(),
        command,
        args,
        timeout,
        cwd: options?.cwd,
        success: true,
        durationMs: Date.now() - startTime,
      });
    }

    return result;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    if (shouldAudit) {
      addAuditEntry({
        timestamp: new Date().toISOString(),
        command,
        args,
        timeout,
        cwd: options?.cwd,
        success: false,
        durationMs: Date.now() - startTime,
        error: errorMessage,
      });
    }

    throw new Error(
      `Command failed: ${command} ${args.map(a => /[^\w@%+=:,./-]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a).join(' ')} - ${errorMessage}`
    );
  }
}

/**
 * Safely execute a command asynchronously using execFile.
 * Arguments are passed as an array, preventing shell injection via string interpolation.
 * 
 * @example
 * const result = await safeExecAsync('docker', ['ps', '-a', '--format', '{{.Names}}']);
 * 
 * @param command - The command to execute (no shell metacharacters interpreted)
 * @param args - Arguments passed as an array (each element is a separate argument)
 * @param options - Execution options
 * @returns The stdout output as a string
 * @throws Error if the command fails
 */
export async function safeExecAsync(command: string, args: string[], options?: SafeExecOptions): Promise<string> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxBuffer = options?.maxBuffer ?? DEFAULT_MAX_BUFFER;
  const shouldAudit = options?.audit !== false;
  const startTime = Date.now();

  return new Promise<string>((resolve, reject) => {
    const child = execFile(command, args, {
      encoding: 'utf-8',
      timeout,
      maxBuffer,
      cwd: options?.cwd,
      env: options?.env,
    }, (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;

      if (error) {
        const errorMessage = error.message || String(error);
        
        if (shouldAudit) {
          addAuditEntry({
            timestamp: new Date().toISOString(),
            command,
            args,
            timeout,
            cwd: options?.cwd,
            success: false,
            durationMs,
            error: errorMessage,
          });
        }

        reject(new Error(
          `Command failed: ${command} ${args.map(a => /[^\w@%+=:,./-]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a).join(' ')} - ${errorMessage}`
        ));
        return;
      }

      if (shouldAudit) {
        addAuditEntry({
          timestamp: new Date().toISOString(),
          command,
          args,
          timeout,
          cwd: options?.cwd,
          success: true,
          durationMs,
        });
      }

      resolve(stdout);
    });

    // Ensure the child process is killed on timeout
    if (timeout) {
      setTimeout(() => {
        child.kill('SIGTERM');
      }, timeout + 1000); // Grace period after execFile's own timeout
    }
  });
}

/**
 * Execute a shell command string safely by using /bin/sh with -c flag.
 * Use ONLY when array-based argument passing is not possible (e.g., complex docker run commands).
 * The command string is logged for audit purposes.
 * 
 * WARNING: This is less safe than safeExec because the command string passes through a shell.
 * Prefer safeExec() with array arguments wherever possible.
 * 
 * @param commandString - The full command string to execute via /bin/sh
 * @param options - Execution options
 * @returns The stdout output as a string
 */
export function safeShellExec(commandString: string, options?: SafeExecOptions): string {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxBuffer = options?.maxBuffer ?? DEFAULT_MAX_BUFFER;
  const shouldAudit = options?.audit !== false;
  const startTime = Date.now();

  try {
    const result = execFileSync('/bin/sh', ['-c', commandString], {
      encoding: 'utf-8',
      timeout,
      maxBuffer,
      cwd: options?.cwd,
      env: options?.env,
    });

    if (shouldAudit) {
      addAuditEntry({
        timestamp: new Date().toISOString(),
        command: '/bin/sh',
        args: ['-c', commandString],
        timeout,
        cwd: options?.cwd,
        success: true,
        durationMs: Date.now() - startTime,
      });
    }

    return result;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);

    if (shouldAudit) {
      addAuditEntry({
        timestamp: new Date().toISOString(),
        command: '/bin/sh',
        args: ['-c', commandString],
        timeout,
        cwd: options?.cwd,
        success: false,
        durationMs: Date.now() - startTime,
        error: errorMessage,
      });
    }

    throw new Error(`Shell command failed: ${commandString.substring(0, 200)} - ${errorMessage}`);
  }
}

/**
 * Async version of safeShellExec.
 * Use ONLY when array-based argument passing is not possible.
 */
export async function safeShellExecAsync(commandString: string, options?: SafeExecOptions): Promise<string> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const maxBuffer = options?.maxBuffer ?? DEFAULT_MAX_BUFFER;
  const shouldAudit = options?.audit !== false;
  const startTime = Date.now();

  return new Promise<string>((resolve, reject) => {
    execFile('/bin/sh', ['-c', commandString], {
      encoding: 'utf-8',
      timeout,
      maxBuffer,
      cwd: options?.cwd,
      env: options?.env,
    }, (error, stdout) => {
      const durationMs = Date.now() - startTime;

      if (error) {
        const errorMessage = error.message || String(error);

        if (shouldAudit) {
          addAuditEntry({
            timestamp: new Date().toISOString(),
            command: '/bin/sh',
            args: ['-c', commandString],
            timeout,
            cwd: options?.cwd,
            success: false,
            durationMs,
            error: errorMessage,
          });
        }

        reject(new Error(`Shell command failed: ${commandString.substring(0, 200)} - ${errorMessage}`));
        return;
      }

      if (shouldAudit) {
        addAuditEntry({
          timestamp: new Date().toISOString(),
          command: '/bin/sh',
          args: ['-c', commandString],
          timeout,
          cwd: options?.cwd,
          success: true,
          durationMs,
        });
      }

      resolve(stdout);
    });
  });
}
