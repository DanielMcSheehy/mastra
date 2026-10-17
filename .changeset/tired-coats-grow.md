---
'@mastra/server': patch
'@mastra/core': patch
---

Fixed `POST /agents/:id/observe` leaving the stream open until the idle timeout for a run that was never started on this deployment, and for a run whose execution released it without resuming.

The route now ends the stream only when the run is provably over: no execution owns the run (checked through the workflows store's ownership record, with the pubsub lease as a fallback) and its saved snapshot is missing or terminal. A run that still holds its claim, was released with a running/pending/suspended snapshot, or whose store cannot fence runs stays open, since a resume or recovery in another process can still publish to it.
