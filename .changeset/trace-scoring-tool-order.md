---
'@mastra/core': patch
---

Fixed trace scoring so tool calls that start in the same millisecond keep their trace order instead of coming out reversed, and provider-executed tools (for example Anthropic web search) are now included in the tool invocations scored from a trace.
