'use strict';

const { CLIError } = require('./errors');

const KNOWN_FLAGS = new Set(['--dry-run', '--mode', '--pattern']);

/**
 * Parses CLI arguments.
 * @param {string[]} argv - process.argv slice (e.g. process.argv.slice(2))
 * @returns {{ dryRun: boolean, mode: string|null, patternFile: string|null }}
 * @throws {CLIError} on unrecognised flags
 */
function parseArgs(argv) {
  let dryRun = false;
  let mode = null;
  let patternFile = null;

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--dry-run') {
      dryRun = true;
      i++;
    } else if (arg === '--mode') {
      mode = argv[i + 1];
      i += 2;
    } else if (arg === '--pattern') {
      patternFile = argv[i + 1];
      i += 2;
    } else if (arg.startsWith('-')) {
      throw new CLIError(`Unrecognised flag: ${arg}`);
    } else {
      i++;
    }
  }

  return { dryRun, mode, patternFile };
}

module.exports = { parseArgs };
