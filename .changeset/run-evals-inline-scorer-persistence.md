---
'@mastra/core': patch
---

Fixed `runEvals` silently dropping scores for scorers passed only via `runEvals({ scorers })`. Scorers no longer need to also be registered on the `Mastra` instance for their scores to be saved to storage.
