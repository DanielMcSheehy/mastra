---
'@mastra/server': patch
'@mastra/core': patch
---

Fixed `observe()` sending duplicate frames on a replay-capable transport (Redis Streams, Unix sockets) and losing the start of a run when the observing process had no cached history.

Events published by evented durable steps now carry a per-run sequence allocated through the shared cache, so a transport replay is numbered like any other frame: the requested offset is respected, and an observer counts each event once. Subscriptions dedupe those frames by exact sequence rather than a high-water mark, so two workers that allocate 5 and 6 can publish them in either order without one being dropped, and a cold process can rebuild a run from the transport's retained history. Frames published by an agent's own per-process indexer keep the previous ordering behaviour, so a stale frame from a discarded model attempt is not surfaced to a live subscriber. Topic histories that are not in index order fall back to a full read and sort instead of a positional slice, and a history whose list expired while its index counter survived is read from the surviving entries instead of returning an empty window.

Numbering is only enabled when the cache allocates the index and appends the entry atomically; on other caches events stay unnumbered and are deduped by id. Across a rolling deploy the new workers' frames reach an older observer without a numeric index, so an API process that has not upgraded yet delivers them exactly as it does today instead of dropping them as stale.
