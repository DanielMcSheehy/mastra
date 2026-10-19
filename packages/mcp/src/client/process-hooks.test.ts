import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const tsxCli = path.join(path.dirname(require.resolve('tsx/package.json')), 'dist', 'cli.mjs');
const hostPath = path.join(__dirname, '..', '__fixtures__/shutdown-host.ts');

/** Starts the host fixture, sends it SIGTERM once its client is connected, and reports how it exited. */
async function terminateHost(env: Record<string, string>) {
  // Loaded with `--import` rather than the tsx CLI so the signal reaches the host itself.
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), hostPath], {
    env: { ...process.env, TSX_CLI: tsxCli, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', chunk => {
    const wasReady = stdout.includes('host: ready');
    stdout += chunk;
    if (!wasReady && stdout.includes('host: ready')) child.kill('SIGTERM');
  });
  child.stderr.on('data', chunk => (stderr += chunk));

  const { promise, resolve } = Promise.withResolvers<{ code: number | null; stdout: string; stderr: string }>();
  child.on('exit', code => resolve({ code, stdout, stderr }));
  return promise;
}

// Windows has no catchable SIGTERM, so the host cannot run a shutdown handler there.
describe.skipIf(process.platform === 'win32')('MCPClient registerProcessHooks', () => {
  it('lets the host finish its own SIGTERM handler when process hooks are disabled', async () => {
    const result = await terminateHost({ REGISTER_PROCESS_HOOKS: 'false' });

    expect(result.stdout).toContain('host: cleanup started');
    expect(result.stdout, result.stderr).toContain('host: cleanup finished');
    expect(result.code).toBe(0);
  }, 30000);
});
