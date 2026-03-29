'use strict';

const { isAllowedPath, buildLogEntry, buildContent, commit } = require('../../lib/committer');
const { CommitError } = require('../../lib/errors');

describe('isAllowedPath', () => {
  test('allows .md files', () => {
    expect(isAllowedPath('changelog.md')).toBe(true);
    expect(isAllowedPath('notes/daily.md')).toBe(true);
  });

  test('allows .json files', () => {
    expect(isAllowedPath('data/activity-log.json')).toBe(true);
  });

  test('allows .txt files', () => {
    expect(isAllowedPath('notes.txt')).toBe(true);
  });

  test('rejects .js files', () => {
    expect(isAllowedPath('index.js')).toBe(false);
  });

  test('rejects .ts files', () => {
    expect(isAllowedPath('lib/helper.ts')).toBe(false);
  });

  test('rejects .py files', () => {
    expect(isAllowedPath('script.py')).toBe(false);
  });

  test('rejects .env files', () => {
    expect(isAllowedPath('.env')).toBe(false);
    expect(isAllowedPath('config/.env')).toBe(false);
  });

  test('rejects package.json by name', () => {
    expect(isAllowedPath('package.json')).toBe(false);
    expect(isAllowedPath('subdir/package.json')).toBe(false);
  });
});

describe('buildLogEntry', () => {
  test('returns object with all required fields', () => {
    const entry = buildLogEntry('2025-01-15', '09:00:42Z', 'a3f9c1', 'realistic', 0);
    expect(entry).toEqual({
      date: '2025-01-15',
      time: '09:00:42Z',
      runId: 'a3f9c1',
      mode: 'realistic',
      commitIndex: 0,
    });
  });

  test('preserves all field values exactly', () => {
    const entry = buildLogEntry('2025-06-01', '12:30:00Z', 'ff0011', 'burst', 3);
    expect(entry.date).toBe('2025-06-01');
    expect(entry.time).toBe('12:30:00Z');
    expect(entry.runId).toBe('ff0011');
    expect(entry.mode).toBe('burst');
    expect(entry.commitIndex).toBe(3);
  });
});

describe('buildContent', () => {
  test('appends entry as JSON string to existing content', () => {
    const entry = { date: '2025-01-15', runId: 'abc123' };
    const result = buildContent('existing\n', entry, 'safe-token');
    expect(result).toContain('existing\n');
    expect(result).toContain(JSON.stringify(entry));
  });

  test('throws CommitError if token appears in the result', () => {
    const token = 'secret-token-xyz';
    const entry = { note: `contains ${token} here` };
    expect(() => buildContent('', entry, token)).toThrow(CommitError);
  });

  test('does not throw when token is not in result', () => {
    const entry = { date: '2025-01-15', runId: 'abc123' };
    expect(() => buildContent('', entry, 'safe-token-not-present')).not.toThrow();
  });
});

describe('commit', () => {
  const originalEnv = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    process.env.GITHUB_TOKEN = 'test-token';
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalEnv;
    }
  });

  test('throws CommitError for forbidden file extension (.js)', async () => {
    const octokit = {};
    await expect(commit(octokit, 'owner/repo', 'owner', 'index.js', 'content', 'msg'))
      .rejects.toThrow(CommitError);
  });

  test('throws CommitError for forbidden file extension (.ts)', async () => {
    const octokit = {};
    await expect(commit(octokit, 'owner/repo', 'owner', 'lib/helper.ts', 'content', 'msg'))
      .rejects.toThrow(CommitError);
  });

  test('throws CommitError for package.json', async () => {
    const octokit = {};
    await expect(commit(octokit, 'owner/repo', 'owner', 'package.json', 'content', 'msg'))
      .rejects.toThrow(CommitError);
  });

  test('throws CommitError when GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const octokit = {};
    await expect(commit(octokit, 'owner/repo', 'owner', 'changelog.md', 'content', 'msg'))
      .rejects.toThrow(CommitError);
  });

  test('throws CommitError when repo format is invalid', async () => {
    const octokit = {};
    await expect(commit(octokit, 'invalid-repo-no-slash', 'owner', 'changelog.md', 'content', 'msg'))
      .rejects.toThrow(CommitError);
  });

  test('creates file when it does not exist (404 on getContent)', async () => {
    const createOrUpdateFileContents = jest.fn().mockResolvedValue({});
    const octokit = {
      repos: {
        getContent: jest.fn().mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 })),
        createOrUpdateFileContents,
      },
    };

    await commit(octokit, 'owner/repo', 'owner', 'changelog.md', 'hello', 'chore: init');

    expect(createOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({ sha: undefined, path: 'changelog.md' })
    );
  });

  test('updates file with sha when it already exists', async () => {
    const createOrUpdateFileContents = jest.fn().mockResolvedValue({});
    const octokit = {
      repos: {
        getContent: jest.fn().mockResolvedValue({ data: { sha: 'abc123sha' } }),
        createOrUpdateFileContents,
      },
    };

    await commit(octokit, 'owner/repo', 'owner', 'changelog.md', 'hello', 'chore: update');

    expect(createOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({ sha: 'abc123sha' })
    );
  });

  test('encodes content as base64', async () => {
    const createOrUpdateFileContents = jest.fn().mockResolvedValue({});
    const octokit = {
      repos: {
        getContent: jest.fn().mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 })),
        createOrUpdateFileContents,
      },
    };

    await commit(octokit, 'owner/repo', 'owner', 'changelog.md', 'hello world', 'msg');

    const call = createOrUpdateFileContents.mock.calls[0][0];
    expect(call.content).toBe(Buffer.from('hello world').toString('base64'));
  });
});
