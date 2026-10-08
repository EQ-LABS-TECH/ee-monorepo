import { describe, expect, it } from 'vitest';
import { isKnowledgeError, KNOWLEDGE_PORT_VERSION } from '@eq-labs/foundation';
import { createInMemoryKnowledgePort } from './in-memory-port.js';
import { createUnavailableKnowledgePort } from './unavailable-port.js';

describe('createInMemoryKnowledgePort', () => {
  it('reports healthy in-memory backend', async () => {
    const port = createInMemoryKnowledgePort();
    const health = await port.health();
    expect(isKnowledgeError(health)).toBe(false);
    if (isKnowledgeError(health)) return;
    expect(health.ok).toBe(true);
    expect(health.backend).toBe('in-memory');
    expect(health.portVersion).toBe(KNOWLEDGE_PORT_VERSION);
  });

  it('indexes and retrieves a unit', async () => {
    const port = createInMemoryKnowledgePort();
    const indexed = await port.index({
      units: [
        {
          id: 'u1',
          content: 'hello knowledge',
          meta: { id: 'u1', tags: ['t1'] },
        },
      ],
    });
    expect(isKnowledgeError(indexed)).toBe(false);
    if (isKnowledgeError(indexed)) return;
    expect(indexed.accepted).toBe(1);

    const unit = await port.retrieve('u1');
    expect(isKnowledgeError(unit)).toBe(false);
    if (isKnowledgeError(unit)) return;
    expect(unit.content).toBe('hello knowledge');
  });

  it('queries by id filter', async () => {
    const port = createInMemoryKnowledgePort();
    await port.index({
      units: [
        { id: 'a', content: 'A' },
        { id: 'b', content: 'B' },
      ],
    });
    const result = await port.query({ ids: ['b'] });
    expect(isKnowledgeError(result)).toBe(false);
    if (isKnowledgeError(result)) return;
    expect(result.units).toHaveLength(1);
    expect(result.units[0]?.id).toBe('b');
  });

  it('returns NOT_FOUND for missing id', async () => {
    const port = createInMemoryKnowledgePort();
    const unit = await port.retrieve('missing');
    expect(isKnowledgeError(unit)).toBe(true);
    if (!isKnowledgeError(unit)) return;
    expect(unit.code).toBe('NOT_FOUND');
  });

  it('returns NOT_IMPLEMENTED for semanticSearch', async () => {
    const port = createInMemoryKnowledgePort();
    const result = await port.semanticSearch({ text: 'q' });
    expect(isKnowledgeError(result)).toBe(true);
    if (!isKnowledgeError(result)) return;
    expect(result.code).toBe('NOT_IMPLEMENTED');
  });
});

describe('createUnavailableKnowledgePort (KN-10)', () => {
  it('reports unhealthy health', async () => {
    const port = createUnavailableKnowledgePort();
    const health = await port.health();
    expect(isKnowledgeError(health)).toBe(false);
    if (isKnowledgeError(health)) return;
    expect(health.ok).toBe(false);
    expect(health.backend).toBe('none');
  });

  it('returns UNAVAILABLE on retrieve', async () => {
    const port = createUnavailableKnowledgePort();
    const unit = await port.retrieve('any');
    expect(isKnowledgeError(unit)).toBe(true);
    if (!isKnowledgeError(unit)) return;
    expect(unit.code).toBe('UNAVAILABLE');
  });
});
