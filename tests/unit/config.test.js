'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadConfig } = require('../../lib/config');
const { ConfigError } = require('../../lib/errors');

function writeTempConfig(obj) {
  const dir = os.tmpdir();
  const filePath = path.join(dir, `config-test-${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(obj), 'utf8');
  return filePath;
}

const validConfig = {
  repo: 'user/dev-activity',
  mode: 'realistic',
  commitsPerDay: {
    steady: 1,
    burst: { min: 3, max: 8 },
    realistic: { min: 0, max: 5, weights: [10, 30, 25, 20, 10, 5] }
  },
  targetFiles: ['changelog.md', 'data/activity-log.json'],
  commitMessages: ['chore: update log', 'docs: daily sync'],
  devNotes: ['Reviewed async patterns.', 'Explored new tooling.']
};

describe('loadConfig', () => {
  test('returns config object for valid config', () => {
    const filePath = writeTempConfig(validConfig);
    const config = loadConfig(filePath);
    expect(config.repo).toBe('user/dev-activity');
    expect(config.mode).toBe('realistic');
    expect(config.targetFiles).toHaveLength(2);
  });

  test('throws ConfigError if file does not exist', () => {
    expect(() => loadConfig('/nonexistent/path/config.json')).toThrow(ConfigError);
  });

  test('throws ConfigError if file contains invalid JSON', () => {
    const dir = os.tmpdir();
    const filePath = path.join(dir, `bad-json-${Date.now()}.json`);
    fs.writeFileSync(filePath, '{ not valid json }', 'utf8');
    expect(() => loadConfig(filePath)).toThrow(ConfigError);
  });

  test('throws ConfigError if repo is missing', () => {
    const { repo, ...rest } = validConfig;
    expect(() => loadConfig(writeTempConfig(rest))).toThrow(ConfigError);
  });

  test('throws ConfigError if mode is missing', () => {
    const { mode, ...rest } = validConfig;
    expect(() => loadConfig(writeTempConfig(rest))).toThrow(ConfigError);
  });

  test('throws ConfigError if commitsPerDay is missing', () => {
    const { commitsPerDay, ...rest } = validConfig;
    expect(() => loadConfig(writeTempConfig(rest))).toThrow(ConfigError);
  });

  test('throws ConfigError if targetFiles is missing', () => {
    const { targetFiles, ...rest } = validConfig;
    expect(() => loadConfig(writeTempConfig(rest))).toThrow(ConfigError);
  });

  test('throws ConfigError if commitMessages has fewer than 2 entries', () => {
    const cfg = { ...validConfig, commitMessages: ['only one'] };
    expect(() => loadConfig(writeTempConfig(cfg))).toThrow(ConfigError);
  });

  test('throws ConfigError if devNotes has fewer than 2 entries', () => {
    const cfg = { ...validConfig, devNotes: ['only one'] };
    expect(() => loadConfig(writeTempConfig(cfg))).toThrow(ConfigError);
  });

  test('throws ConfigError if commitMessages is not an array', () => {
    const cfg = { ...validConfig, commitMessages: 'not an array' };
    expect(() => loadConfig(writeTempConfig(cfg))).toThrow(ConfigError);
  });

  test('throws ConfigError if devNotes is not an array', () => {
    const cfg = { ...validConfig, devNotes: 'not an array' };
    expect(() => loadConfig(writeTempConfig(cfg))).toThrow(ConfigError);
  });

  test('error message mentions the missing field', () => {
    const { repo, ...rest } = validConfig;
    expect(() => loadConfig(writeTempConfig(rest))).toThrow('repo');
  });
});
