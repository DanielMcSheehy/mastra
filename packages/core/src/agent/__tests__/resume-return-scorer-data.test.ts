import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Mastra } from '../../mastra';
import { InMemoryStore } from '../../storage';
import { createTool } from '../../tools';
import { Agent } from '../agent';
import { MockLanguageModelV2 } from './mock-model';

// Regression for #27580: a run-level `returnScorerData: true` passed to
// generate() must survive a suspend/resumeGenerate() cycle without the caller
// re-passing it, matching the durable agent behavior.
function createToolCallThenTextModel() {
  let call = 0;
  const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };
  return new MockLanguageModelV2({
    doGenerate: async () => {
      call++;
      return call === 1
        ? {
            rawCall: { rawPrompt: null, rawSettings: {} },
            warnings: [],
            finishReason: 'tool-calls' as const,
            usage,
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-1',
                toolName: 'searchTool',
                input: JSON.stringify({ query: 'mastra' }),
              },
            ],
          }
        : {
            rawCall: { rawPrompt: null, rawSettings: {} },
            warnings: [],
            finishReason: 'stop' as const,
            usage,
            content: [{ type: 'text' as const, text: 'Found: mastra' }],
          };
    },
  });
}

function setup(defaultOptions?: { returnScorerData?: boolean }) {
  const searchTool = createTool({
    id: 'searchTool',
    description: 'search',
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => ({ result: `Found: ${query}` }),
  });
  const agent = new Agent({
    id: 'resume-scorer-agent',
    name: 'Resume Scorer Agent',
    instructions: 'test',
    model: createToolCallThenTextModel(),
    tools: { searchTool },
    ...(defaultOptions ? { defaultOptions } : {}),
  });
  const mastra = new Mastra({ agents: { agent }, storage: new InMemoryStore(), logger: false });
  return mastra.getAgent('agent');
}

describe('resumeGenerate preserves run-level returnScorerData (#27580)', () => {
  it.each([
    ['no defaultOptions', undefined],
    ['defaultOptions disable it', { returnScorerData: false }],
  ])('returns scoringData after approval resume (%s)', async (_label, defaultOptions) => {
    const agent = setup(defaultOptions);
    const first = await agent.generate('search mastra', { requireToolApproval: true, returnScorerData: true });
    expect(first.finishReason).toBe('suspended');

    const second = await agent.resumeGenerate({ approved: true }, { runId: first.runId! });
    expect(second.finishReason).toBe('stop');
    expect(second.scoringData).toBeDefined();
    expect(JSON.stringify(second.scoringData!.output)).toContain('Found: mastra');
  });

  it('caller can still opt out on resume', async () => {
    const agent = setup();
    const first = await agent.generate('search mastra', { requireToolApproval: true, returnScorerData: true });
    const second = await agent.resumeGenerate({ approved: true }, { runId: first.runId!, returnScorerData: false });
    expect(second.scoringData).toBeUndefined();
  });
});
