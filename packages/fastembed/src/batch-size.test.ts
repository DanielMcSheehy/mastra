import { describe, expect, test, vi } from 'vitest';
import { EmbeddingModel, FlagEmbedding, SparseTextEmbedding } from './fastembed.js';

// The constructors are private; build instances around stub tokenizer/session fixtures so no model is loaded.
function createTokenizer() {
  return {
    encode: vi.fn(async () => ({
      getIds: () => [1, 2],
      getAttentionMask: () => [1, 1],
      getTypeIds: () => [0, 0],
      getOverflowing: () => [],
      getLength: () => 2,
    })),
  };
}

function createDense(tokenizer = createTokenizer()) {
  return Reflect.construct(FlagEmbedding, [tokenizer, {}, EmbeddingModel.BGESmallENV15]) as FlagEmbedding;
}

function createSparse(tokenizer = createTokenizer()) {
  return Reflect.construct(SparseTextEmbedding, [tokenizer, {}]) as SparseTextEmbedding;
}

const invalidBatchSizes = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1];

describe.each([
  { name: 'FlagEmbedding', create: createDense },
  { name: 'SparseTextEmbedding', create: createSparse },
])('$name batchSize validation', ({ create }) => {
  test.each(invalidBatchSizes)('embed rejects batchSize %s before tokenizing', async batchSize => {
    const tokenizer = createTokenizer();
    const model = create(tokenizer);

    await expect(model.embed(['hello'], batchSize).next()).rejects.toThrow(RangeError);
    expect(tokenizer.encode).not.toHaveBeenCalled();
  });

  test.each(invalidBatchSizes)('embed rejects batchSize %s for empty input', async batchSize => {
    await expect(create().embed([], batchSize).next()).rejects.toThrow(RangeError);
  });

  test.each(invalidBatchSizes)('passageEmbed rejects batchSize %s', async batchSize => {
    await expect(create().passageEmbed(['hello'], batchSize).next()).rejects.toThrow(RangeError);
  });
});

describe('FlagEmbedding.countTruncated batchSize validation', () => {
  test.each(invalidBatchSizes)('rejects batchSize %s before tokenizing', async batchSize => {
    const tokenizer = createTokenizer();
    // A zero increment never advances the loop; cap length reads so a regression fails instead of hanging.
    let lengthReads = 0;
    const texts = new Proxy(['hello'], {
      get(target, property, receiver) {
        if (property === 'length' && ++lengthReads > 10) throw new Error('countTruncated did not advance');
        return Reflect.get(target, property, receiver);
      },
    });

    await expect(createDense(tokenizer).countTruncated(texts, batchSize)).rejects.toThrow(RangeError);
    expect(tokenizer.encode).not.toHaveBeenCalled();
  });

  test('counts every input across partial batches', async () => {
    const tokenizer = createTokenizer();

    await expect(createDense(tokenizer).countTruncated(['a', 'b', 'c'], 2)).resolves.toEqual({
      count: 0,
      maxLength: 0,
    });
    expect(tokenizer.encode).toHaveBeenCalledTimes(3);
  });
});
