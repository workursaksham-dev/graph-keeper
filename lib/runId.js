const crypto = require('crypto');

/**
 * Generates a 6-character random hexadecimal string.
 * @returns {string} e.g. "a3f9c1"
 */
function generateRunId() {
  return crypto.randomBytes(3).toString('hex');
}

module.exports = { generateRunId };
