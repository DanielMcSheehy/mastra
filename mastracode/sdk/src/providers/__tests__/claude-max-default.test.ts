import { describe, expect, it } from 'vitest';
import { opencodeClaudeMaxProvider } from '../claude-max.js';

describe('opencodeClaudeMaxProvider', () => {
  it('defaults to a non-retired Claude model', () => {
    const model = opencodeClaudeMaxProvider() as { modelId: string };
    expect(model.modelId).toBe('claude-sonnet-4-6');
  });
});
