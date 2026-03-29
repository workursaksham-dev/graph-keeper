'use strict';

const { ModeError } = require('./errors');

/**
 * Returns the day-of-year (0-indexed) for a given Date.
 * @param {Date} date
 * @returns {number}
 */
function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay) - 1; // 0-indexed
}

/**
 * Performs a weighted random selection over values 0..weights.length-1.
 * @param {number[]} weights
 * @returns {number}
 */
function weightedRandom(weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand < 0) return i;
  }
  return weights.length - 1;
}

/**
 * Resolves the number of commits for the current run based on the active mode.
 *
 * @param {string} mode - One of 'steady', 'burst', 'realistic', 'custom'
 * @param {object} commitsPerDay - Config commitsPerDay object
 * @param {number[][]|null} patternGrid - 52×7 grid (required for custom mode)
 * @param {Date} today - The current date (required for custom mode)
 * @returns {number} Number of commits (0 or positive integer)
 * @throws {ModeError} On unknown mode
 */
function resolveCommitCount(mode, commitsPerDay, patternGrid, today) {
  switch (mode) {
    case 'steady':
      return 1;

    case 'burst': {
      const min = commitsPerDay.burst.min; // 3
      const max = commitsPerDay.burst.max; // 8
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    case 'realistic': {
      const weights = commitsPerDay.realistic.weights;
      return weightedRandom(weights);
    }

    case 'custom': {
      const doy = dayOfYear(today);
      const weekIndex = Math.min(Math.floor(doy / 7), 51);
      const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
      return patternGrid[weekIndex][dayOfWeek];
    }

    default:
      throw new ModeError(`Unknown mode: "${mode}"`);
  }
}

module.exports = { resolveCommitCount };
