'use strict';

const fs = require('fs');
const { PatternError } = require('./errors');

/**
 * Loads and validates a 52×7 pattern grid from a JSON file.
 * @param {string} filePath - Path to the JSON file
 * @returns {number[][]} 52×7 grid of integers 0–4
 * @throws {PatternError} if file is missing, unreadable, invalid JSON, or invalid structure/values
 */
function loadPatternGrid(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new PatternError(`Pattern file not found or unreadable: ${filePath}`);
  }

  let grid;
  try {
    grid = JSON.parse(raw);
  } catch (err) {
    throw new PatternError(`Pattern file contains invalid JSON: ${filePath}`);
  }

  if (!Array.isArray(grid) || grid.length !== 52) {
    throw new PatternError(
      `Pattern grid must be an array of exactly 52 rows, got ${Array.isArray(grid) ? grid.length : typeof grid}`
    );
  }

  for (let week = 0; week < 52; week++) {
    const row = grid[week];
    if (!Array.isArray(row) || row.length !== 7) {
      throw new PatternError(
        `Pattern grid row ${week} must be an array of exactly 7 integers, got ${Array.isArray(row) ? row.length : typeof row}`
      );
    }
    for (let day = 0; day < 7; day++) {
      const val = row[day];
      if (!Number.isInteger(val) || val < 0 || val > 4) {
        throw new PatternError(
          `Pattern grid value at [${week}][${day}] must be an integer 0–4, got ${val}`
        );
      }
    }
  }

  return grid;
}

module.exports = { loadPatternGrid };
