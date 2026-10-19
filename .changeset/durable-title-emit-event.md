---
'@mastra/core': patch
---

Durable and evented agents now stream the transient `data-thread-title` chunk before `finish` when `memory.options.generateTitle.emitEvent` is set, and run the per-call `memory.onTitleGenerated` callback after the title is saved, matching the regular agent loop.
