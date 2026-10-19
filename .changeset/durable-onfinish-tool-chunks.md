---
'@mastra/core': patch
---

Durable and evented agents now pass `onFinish` the same chunk-shaped `toolCalls`/`toolResults` (top-level and per-step) as the default engine, so code like `result.toolResults[0].payload.result` works on every engine.
