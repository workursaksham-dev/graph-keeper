/**
 * Message Rotator
 * Selects commit messages in a non-repeating sequence within a run.
 */

/**
 * Creates a rotator that returns messages from the pool, never repeating
 * the same message twice in a row.
 *
 * @param {string[]} messages - Array of message strings (must have >= 2 entries)
 * @returns {{ next(): string }}
 * @throws {Error} if messages has fewer than 2 entries
 */
function createRotator(messages) {
  if (!Array.isArray(messages) || messages.length < 2) {
    throw new Error('createRotator requires at least 2 messages');
  }

  let last = null;

  return {
    next() {
      // Build pool excluding the last used message
      const pool = messages.filter((m) => m !== last);
      const index = Math.floor(Math.random() * pool.length);
      last = pool[index];
      return last;
    },
  };
}

module.exports = { createRotator };
