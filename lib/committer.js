'use strict';

const { CommitError } = require('./errors');

const ALLOWED_EXTENSIONS = new Set(['.md', '.json', '.txt']);
const FORBIDDEN_EXTENSIONS = new Set(['.js', '.ts', '.py', '.env']);

/**
 * Returns true if the file path is allowed to be written by the Committer.
 * @param {string} filePath
 * @returns {boolean}
 */
function isAllowedPath(filePath) {
  const basename = filePath.split('/').pop().split('\\').pop();
  if (basename === 'package.json') return false;

  const dotIndex = basename.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const ext = basename.slice(dotIndex).toLowerCase();
  if (FORBIDDEN_EXTENSIONS.has(ext)) return false;
  return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Builds a log entry object for activity-log.json.
 * @param {string} date
 * @param {string} time
 * @param {string} runId
 * @param {string} mode
 * @param {number} commitIndex
 * @returns {{ date: string, time: string, runId: string, mode: string, commitIndex: number }}
 */
function buildLogEntry(date, time, runId, mode, commitIndex) {
  return { date, time, runId, mode, commitIndex };
}

/**
 * Appends a log entry (as JSON string) to existing content.
 * Throws CommitError if the token appears in the resulting content.
 * @param {string} existingContent
 * @param {object} entry
 * @param {string} token
 * @returns {string}
 */
function buildContent(existingContent, entry, token) {
  const result = existingContent + JSON.stringify(entry) + '\n';
  if (token && result.includes(token)) {
    throw new CommitError('Token must not appear in file content');
  }
  return result;
}

/**
 * Commits a file to GitHub via Octokit.
 * @param {object} octokit
 * @param {string} repo  - full "owner/reponame" string
 * @param {string} owner
 * @param {string} filePath
 * @param {string} content
 * @param {string} message
 * @returns {Promise<void>}
 */
async function commit(octokit, repo, owner, filePath, content, message) {
  // Pre-flight: allowed path
  if (!isAllowedPath(filePath)) {
    throw new CommitError(`Forbidden file path: ${filePath}`);
  }

  // Pre-flight: GITHUB_TOKEN present
  if (!process.env.GITHUB_TOKEN) {
    throw new CommitError('GITHUB_TOKEN environment variable is not set');
  }

  // Pre-flight: repo matches owner/repo format
  if (!/^[^/]+\/[^/]+$/.test(repo)) {
    throw new CommitError(`Invalid repo format: ${repo}`);
  }

  const repoName = repo.split('/')[1];
  const encodedContent = Buffer.from(content).toString('base64');

  let sha;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo: repoName, path: filePath });
    sha = data.sha;
  } catch (err) {
    if (err.status === 404) {
      sha = undefined;
    } else {
      throw new CommitError(`Failed to get file SHA: ${err.message}`);
    }
  }

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: filePath,
      message,
      content: encodedContent,
      sha,
    });
  } catch (err) {
    throw new CommitError(`Failed to commit file: ${err.message}`);
  }
}

module.exports = { isAllowedPath, buildLogEntry, buildContent, commit };
