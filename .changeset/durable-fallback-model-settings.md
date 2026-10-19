---
'@mastra/core': patch
---

Fixed durable and evented agents ignoring per-entry `modelSettings` and `providerOptions` on model fallback lists. Each fallback entry now sends its own settings (e.g. `temperature`, `topP`) to the provider, matching the regular agent loop.
