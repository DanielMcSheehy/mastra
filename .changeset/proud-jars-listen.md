---
'@mastra/redis': patch
---

Added `counterTtlSeconds` to `RedisServerCache` (default 86,400 seconds) so the index counter used by `listPushIndexed` outlives the list it indexes instead of expiring with it.

When both keys shared one TTL, a run that stayed quiet longer than the TTL could have its counter reset to zero while subscribers had already delivered indices up to `k`. Every new frame would then be allocated an index in `0..k` and dropped as a duplicate by an observer that was still attached. The counter is now refreshed on every allocation, is removed with the list by `clearTopic`, and `counterTtlSeconds: 0` disables its expiry entirely.
