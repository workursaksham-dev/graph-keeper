'use strict';

const { run, selectDevNote } = require('../../lib/runner');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides = {}) {
  return {
    repo: 'owner/dev-activity',
    mode: 'steady',
    commitsPerDay: {
      steady: 1,
      burst: { min: 3, max: 8 },
      realistic: { min: 0, max: 5, weights: [10, 30, 25, 20, 10, 5] },
    },
    targetFiles: ['changelog.md', 'data/activity-log.json', 'notes/daily.md'],
    commitMessages: ['chore: update log', 'docs: daily sync'],
    devNotes: ['Reviewed async patterns.', 'Explored new tooling.'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// selectDevNote
// ---------------------------------------------------------------------------

describe('selectDevNote', () => {
  test('returns an item from the pool', () => {
    const notes = ['note A', 'note B', 'note C'];
    for (let i = 0; i < 50; i++) {
      expect(notes).toContain(selectDevNote(notes));
    }
  });

  test('works with a single-item pool', () => {
    expect(selectDevNote(['only note'])).toBe('only note');
  });
});

// ---------------------------------------------------------------------------
// run — dry-run produces zero Octokit calls
// ---------------------------------------------------------------------------

describe('run — dry-run', () => {
  let commitMock;
  let originalCommit;

  beforeEach(() => {
    // Patch the committer module's commit function
    const committer = require('../../lib/committer');
    originalCommit = committer.commit;
    commitMock = jest.fn();
    committer.commit = commitMock;
  });

  afterEach(() => {
    const committer = require('../../lib/committer');
    committer.commit = originalCommit;
    jest.clearAllMocks();
  });

  test('makes zero commit() calls in dry-run mode', async () => {
    const config = makeConfig({ mode: 'steady' });
    const options = { dryRun: true, mode: null, patternFile: null };

    await run(config, options, 'abc123');

    expect(commitMock).not.toHaveBeenCalled();
  });

  test('logs to console in dry-run mode', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const config = makeConfig({ mode: 'steady' });
    const options = { dryRun: true, mode: null, patternFile: null };

    await run(config, options, 'abc123');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// run — mode resolution
// ---------------------------------------------------------------------------

describe('run — mode resolution', () => {
  let commitMock;
  let originalCommit;

  beforeEach(() => {
    const committer = require('../../lib/committer');
    originalCommit = committer.commit;
    commitMock = jest.fn().mockResolvedValue(undefined);
    committer.commit = commitMock;
    process.env.GITHUB_TOKEN = 'test-token-xyz';
  });

  afterEach(() => {
    const committer = require('../../lib/committer');
    committer.commit = originalCommit;
    delete process.env.GITHUB_TOKEN;
    jest.clearAllMocks();
  });

  test('uses options.mode when provided, overriding config.mode', async () => {
    // config says 'realistic' but CLI says 'steady' → should make exactly 1 commit
    const config = makeConfig({ mode: 'realistic' });
    const options = { dryRun: true, mode: 'steady', patternFile: null };
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await run(config, options, 'abc123');

    // steady = 1 commit → exactly one dry-run log line starting with '[dry-run] commit 0'
    const commitLines = consoleSpy.mock.calls
      .map((args) => args[0])
      .filter((line) => typeof line === 'string' && line.startsWith('[dry-run] commit'));
    expect(commitLines).toHaveLength(1);

    consoleSpy.mockRestore();
  });

  test('uses config.mode when no CLI mode is provided', async () => {
    // config says 'steady', no CLI override → 1 commit
    const config = makeConfig({ mode: 'steady' });
    const options = { dryRun: true, mode: null, patternFile: null };
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await run(config, options, 'abc123');

    const commitLines = consoleSpy.mock.calls
      .map((args) => args[0])
      .filter((line) => typeof line === 'string' && line.startsWith('[dry-run] commit'));
    expect(commitLines).toHaveLength(1);

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// run — dev-note is selected from the pool
// ---------------------------------------------------------------------------

describe('run — dev-note selection', () => {
  test('dev-note logged in dry-run is always from the configured pool', async () => {
    const devNotes = ['Note alpha', 'Note beta', 'Note gamma'];
    const config = makeConfig({ mode: 'steady', devNotes });
    const options = { dryRun: true, mode: null, patternFile: null };

    const loggedLines = [];
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
      loggedLines.push(args[0]);
    });

    await run(config, options, 'abc123');

    consoleSpy.mockRestore();

    // Find the commit line that contains the note
    const commitLine = loggedLines.find(
      (l) => typeof l === 'string' && l.startsWith('[dry-run] commit')
    );
    expect(commitLine).toBeDefined();

    const noteMatch = devNotes.some((note) => commitLine.includes(note));
    expect(noteMatch).toBe(true);
  });
});
