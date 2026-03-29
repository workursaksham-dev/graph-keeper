const { createRotator } = require('../../lib/messages');

describe('createRotator', () => {
  test('throws if fewer than 2 messages', () => {
    expect(() => createRotator([])).toThrow();
    expect(() => createRotator(['only one'])).toThrow();
  });

  test('throws for non-array input', () => {
    expect(() => createRotator(null)).toThrow();
    expect(() => createRotator('string')).toThrow();
  });

  test('returns a message from the pool', () => {
    const messages = ['a', 'b', 'c'];
    const rotator = createRotator(messages);
    const result = rotator.next();
    expect(messages).toContain(result);
  });

  test('never returns the same message twice in a row', () => {
    const messages = ['msg1', 'msg2', 'msg3'];
    const rotator = createRotator(messages);
    let prev = rotator.next();
    for (let i = 0; i < 50; i++) {
      const curr = rotator.next();
      expect(curr).not.toBe(prev);
      prev = curr;
    }
  });

  test('works with exactly 2 messages', () => {
    const messages = ['a', 'b'];
    const rotator = createRotator(messages);
    let prev = rotator.next();
    for (let i = 0; i < 20; i++) {
      const curr = rotator.next();
      expect(curr).not.toBe(prev);
      prev = curr;
    }
  });
});
