'use strict';

const { generateRunId } = require('../../lib/runId');

describe('generateRunId', () => {
  test('returns a string of length 6', () => {
    expect(generateRunId()).toHaveLength(6);
  });

  test('returns only lowercase hex characters', () => {
    expect(generateRunId()).toMatch(/^[0-9a-f]{6}$/);
  });

  test('returns different values on successive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateRunId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});
