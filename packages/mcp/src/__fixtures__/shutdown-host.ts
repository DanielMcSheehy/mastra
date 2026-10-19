/**
 * A host process that owns its shutdown: it connects an MCPClient to a stdio server,
 * installs its own async SIGTERM handler, and prints whether that handler got to finish.
 * `REGISTER_PROCESS_HOOKS=false` passes `registerProcessHooks: false` to the client.
 */
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { MCPClient } from '../client/configuration';

const tsxCli = process.env.TSX_CLI!;
const fixturesDir = path.dirname(fileURLToPath(import.meta.url));

const mcp = new MCPClient({
  registerProcessHooks: process.env.REGISTER_PROCESS_HOOKS !== 'false',
  servers: {
    reporter: { command: process.execPath, args: [tsxCli, path.join(fixturesDir, 'cwd-reporter.ts')] },
  },
});

process.on('SIGTERM', async () => {
  console.log('host: cleanup started');
  await mcp.disconnect();
  await delay(500);
  console.log('host: cleanup finished');
  process.exit(0);
});

await mcp.listTools();
console.log('host: ready');
