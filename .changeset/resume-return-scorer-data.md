---
'@mastra/core': patch
---

Fixed `Agent.resumeGenerate()` and `resumeStream()` dropping the original run's `returnScorerData: true` after a suspend (e.g. tool approval). The resumed result now includes `scoringData` without re-passing the option, matching durable agents. An explicit `returnScorerData` on the resume call still wins.
