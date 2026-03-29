'use strict';

class CLIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CLIError';
  }
}

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

class PatternError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PatternError';
  }
}

class CommitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CommitError';
  }
}

class ModeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModeError';
  }
}

module.exports = { CLIError, ConfigError, PatternError, CommitError, ModeError };
