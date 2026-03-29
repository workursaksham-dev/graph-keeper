'use strict';

const fs = require('fs');
const { ConfigError } = require('./errors');

/**
 * Reads and validates config.json at the given file path.
 * @param {string} filePath - Path to config.json
 * @returns {object} Validated config object
 * @throws {ConfigError} If file is missing, unreadable, or schema-invalid
 */
function loadConfig(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new ConfigError(`Config file not found or unreadable: ${filePath}`);
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    throw new ConfigError(`Config file contains invalid JSON: ${filePath}`);
  }

  // Validate required top-level fields
  if (!config.repo || typeof config.repo !== 'string') {
    throw new ConfigError('Config missing required field: repo');
  }

  if (!config.mode || typeof config.mode !== 'string') {
    throw new ConfigError('Config missing required field: mode');
  }

  if (!config.commitsPerDay || typeof config.commitsPerDay !== 'object' || Array.isArray(config.commitsPerDay)) {
    throw new ConfigError('Config missing required field: commitsPerDay');
  }

  if (!Array.isArray(config.targetFiles) || config.targetFiles.length === 0) {
    throw new ConfigError('Config missing required field: targetFiles');
  }

  if (!Array.isArray(config.commitMessages) || config.commitMessages.length < 2) {
    throw new ConfigError('Config field commitMessages must be an array with at least 2 entries');
  }

  if (!Array.isArray(config.devNotes) || config.devNotes.length < 2) {
    throw new ConfigError('Config field devNotes must be an array with at least 2 entries');
  }

  return config;
}

module.exports = { loadConfig };
