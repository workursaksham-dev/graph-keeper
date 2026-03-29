'use strict';

const { Octokit } = require('@octokit/rest');
const { resolveCommitCount } = require('./modes');
const { loadPatternGrid } = require('./pattern');
const { createRotator } = require('./messages');
const { buildLogEntry, buildContent, commit } = require('./committer');

/**
 * Selects a random item from the devNotes array.
 * @param {string[]} devNotes
 * @returns {string}
 */
function selectDevNote(devNotes) {
  return devNotes[Math.floor(Math.random() * devNotes.length)];
}

/**
 * Orchestrates a full run: resolves commit count, selects messages,
 * calls commit (or logs in dry-run mode).
 *
 * @param {object} config - Loaded config object
 * @param {object} options - { dryRun: boolean, mode: string|null, patternFile: string|null }
 * @param {string} runId - 6-char hex run identifier
 * @returns {Promise<void>}
 */
async function run(config, options, runId) {
  // Resolve active mode: CLI flag takes precedence over config
  const mode = options.mode || config.mode;

  // Load pattern grid if a pattern file is specified
  let patternGrid = null;
  if (options.patternFile) {
    patternGrid = loadPatternGrid(options.patternFile);
  }

  // Determine how many commits to make
  const commitCount = resolveCommitCount(mode, config.commitsPerDay, patternGrid, new Date());

  if (commitCount === 0) {
    if (options.dryRun) {
      console.log('[dry-run] No commits scheduled for today (count=0)');
    }
    return;
  }

  // Set up message rotator and Octokit (only needed for real commits)
  const rotator = createRotator(config.commitMessages);
  const owner = config.repo.split('/')[0];

  let octokit;
  if (!options.dryRun) {
    octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19) + 'Z';

  for (let i = 0; i < commitCount; i++) {
    // Cycle through target files
    const filePath = config.targetFiles[i % config.targetFiles.length];

    // Get next non-repeating message
    const message = rotator.next();

    // Select a random dev-note
    const devNote = selectDevNote(config.devNotes);

    // Build log entry and content
    const entry = buildLogEntry(date, time, runId, mode, i);
    const content = buildContent(devNote + '\n', entry, process.env.GITHUB_TOKEN);

    if (options.dryRun) {
      console.log(`[dry-run] commit ${i}: file=${filePath} message="${message}" note="${devNote}"`);
      console.log(`[dry-run]   entry=${JSON.stringify(entry)}`);
    } else {
      await commit(octokit, config.repo, owner, filePath, content, message);
    }
  }
}

module.exports = { run, selectDevNote };
