'use strict';

const { parseArgs } = require('../../lib/args');
const { CLIError } = require('../../lib/errors');

describe('parseArgs', () => {
  test('returns defaults when no args provided', () => {
    expect(parseArgs([])).toEqual({ dryRun: false, mode: null, patternFile: null });
  });

  test('parses --dry-run', () => {
    expect(parseArgs(['--dry-run'])).toMatchObject({ dryRun: true });
  });

  test('parses --mode <value>', () => {
    expect(parseArgs(['--mode', 'burst'])).toMatchObject({ mode: 'burst' });
  });

  test('parses --pattern <file>', () => {
    expect(parseArgs(['--pattern', 'grid.json'])).toMatchObject({ patternFile: 'grid.json' });
  });

  test('parses all flags together', () => {
    const result = parseArgs(['--dry-run', '--mode', 'steady', '--pattern', 'p.json']);
    expect(result).toEqual({ dryRun: true, mode: 'steady', patternFile: 'p.json' });
  });

  test('throws CLIError on unrecognised flag', () => {
    expect(() => parseArgs(['--unknown'])).toThrow(CLIError);
  });

  test('CLIError message includes the bad flag', () => {
    expect(() => parseArgs(['--foo'])).toThrow('--foo');
  });

  test('throws CLIError when unrecognised flag mixed with valid ones', () => {
    expect(() => parseArgs(['--dry-run', '--bad-flag'])).toThrow(CLIError);
  });
});
