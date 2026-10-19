---
'@mastra/mcp': minor
---

Added a `registerProcessHooks` option to `MCPClient` so applications can run their own graceful shutdown. A connected client installed process handlers that disconnected its servers and then ended the process on `SIGINT`, `SIGTERM`, or `SIGHUP`, cutting short any shutdown handler the application had on the same signal. Set `registerProcessHooks: false` and call `disconnect()` from your own handler instead. The default (`true`) keeps the current behavior.

```ts
const mcp = new MCPClient({ servers, registerProcessHooks: false });

process.on('SIGTERM', async () => {
  await drainRequests();
  await mcp.disconnect();
  process.exit(0);
});
```
