---
'@mastra/fastembed': patch
---

Fixed FastEmbed silently accepting bad batch sizes and mismatched embedding results.

- `embed`, `passageEmbed`, and `countTruncated` now throw a `RangeError` when `batchSize` is not a positive integer, instead of failing with an unrelated `TypeError` or looping forever.
- The FastEmbed providers now throw when the number of returned embeddings does not match the number of inputs, so every embedding maps to its input.
