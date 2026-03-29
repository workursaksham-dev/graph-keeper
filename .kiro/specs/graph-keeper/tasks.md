# Implementation Plan: graph-keeper

## Overview

Implement graph-keeper as a Node.js CLI tool that commits log entries to a dedicated GitHub repository on a daily schedule via GitHub Actions. Tasks follow the component architecture in the design, wiring everything together incrementally.

## Tasks

- [x] 1. Scaffold project structure and error classes
  - Create `package.json` with `@octokit/rest`, `fast-check`, and Jest as dependencies
  - Create `lib/errors.js` defining `CLIError`, `ConfigError`, `PatternError`, `CommitError`, and `ModeError` — each extending `Error` with a `name` property
  - Create `.env.example` with `GITHUB_TOKEN=` and `COMMIT_MODE=realistic`
  - _Requirements: 2.3, 8.8, 9.1, 9.2_

- [x] 2. Implement argument parser (`lib/args.js`)
  - [x] 2.1 Implement `parseArgs(argv)` returning `{ dryRun, mode, patternFile }`
    - Accept `--dry-run`, `--mode <value>`, `--pattern <file>`; throw `CLIError` on any unrecognised flag
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 2.2 Write property test for argument parser (P13)
    - **Property 13: Unrecognised CLI flags cause non-zero exit**
    - **Validates: Requirements 6.4**

- [x] 3. Implement config loader (`lib/config.js`)
  - [x] 3.1 Implement `loadConfig(filePath)` that reads and validates `config.json`
    - Validate presence of `repo`, `mode`, `commitsPerDay`, `targetFiles`, `commitMessages` (≥2), `devNotes` (≥2); throw `ConfigError` otherwise
    - _Requirements: 8.1–8.8_
  - [ ]* 3.2 Write property test for config loader (P14)
    - **Property 14: Invalid or missing config causes non-zero exit**
    - **Validates: Requirements 8.8, 8.2–8.7**
  - [ ]* 3.3 Write unit tests for config loader
    - Test missing file, malformed JSON, each missing required field, and a valid config
    - _Requirements: 8.1–8.8_

- [x] 4. Implement RunId generator (`lib/runId.js`)
  - [x] 4.1 Implement `generateRunId()` using `crypto.randomBytes(3).toString('hex')`
    - _Requirements: 5.1_
  - [ ]* 4.2 Write property test for RunId generator (P12)
    - **Property 12: RunId is always exactly 6 hex characters**
    - **Validates: Requirements 5.1**

- [x] 5. Implement pattern grid parser (`lib/pattern.js`)
  - [x] 5.1 Implement `loadPatternGrid(filePath)` that reads and validates a 52×7 grid of integers 0–4; throw `PatternError` on any violation
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [ ]* 5.2 Write property test for pattern grid validation (P15)
    - **Property 15: Pattern grid validation rejects invalid structures**
    - **Validates: Requirements 10.1, 10.3**
  - [ ]* 5.3 Write property test for pattern grid round-trip (P16)
    - **Property 16: Pattern grid round-trip**
    - **Validates: Requirements 10.4**

- [x] 6. Implement mode selector (`lib/modes.js`)
  - [x] 6.1 Implement `resolveCommitCount(mode, commitsPerDay, patternGrid, today)` for all four modes; throw `ModeError` on unknown mode
    - `steady` → 1; `burst` → random [3,8]; `realistic` → weighted random [0,5]; `custom` → grid cell value
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.5, 10.6_
  - [ ]* 6.2 Write property test for steady mode (P5)
    - **Property 5: Steady mode always produces exactly 1 commit**
    - **Validates: Requirements 3.1**
  - [ ]* 6.3 Write property test for burst mode (P6)
    - **Property 6: Burst mode commit count is always in range [3, 8]**
    - **Validates: Requirements 3.2**
  - [ ]* 6.4 Write property test for realistic mode (P7)
    - **Property 7: Realistic mode commit count is always in range [0, 5]**
    - **Validates: Requirements 3.3**
  - [ ]* 6.5 Write property test for custom mode (P8)
    - **Property 8: Custom mode commit count matches grid intensity**
    - **Validates: Requirements 3.4, 10.5, 10.6**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement message rotator (`lib/messages.js`)
  - [x] 8.1 Implement `createRotator(messages)` returning `{ next() }` that never returns the same message twice in a row; throw if fewer than 2 entries
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 8.2 Write property test for messages from pool (P10)
    - **Property 10: All commit messages are from the configured pool**
    - **Validates: Requirements 4.1**
  - [ ]* 8.3 Write property test for no consecutive duplicate messages (P11)
    - **Property 11: No consecutive duplicate commit messages in a run**
    - **Validates: Requirements 4.2, 4.3**

- [x] 9. Implement committer (`lib/committer.js`)
  - [x] 9.1 Implement `isAllowedPath(filePath)` — allow `.md`, `.json`, `.txt`; reject `.js`, `.ts`, `.py`, `.env`, `package.json`
    - _Requirements: 1.5, 2.2_
  - [x] 9.2 Implement `buildLogEntry(date, time, runId, mode, commitIndex)` returning the activity log JSON object
    - _Requirements: 1.2, 5.2_
  - [x] 9.3 Implement `buildContent(existingContent, entry, token)` that appends the entry and verifies the token is absent from the result; throw `CommitError` if token appears
    - _Requirements: 2.4_
  - [x] 9.4 Implement `commit(octokit, repo, owner, filePath, content, message)` with pre-flight checks (allowed path, repo match, token present); create file if missing, otherwise update
    - _Requirements: 1.4, 1.6, 2.1, 2.5_
  - [ ]* 9.5 Write property test for file extension safety (P3)
    - **Property 3: Only allowed file extensions are written**
    - **Validates: Requirements 1.5, 2.2**
  - [ ]* 9.6 Write property test for activity log entry fields (P1)
    - **Property 1: Activity log entry contains all required fields**
    - **Validates: Requirements 1.2, 5.2**
  - [ ]* 9.7 Write property test for token not in content (P4)
    - **Property 4: Token never written to file content**
    - **Validates: Requirements 2.4**
  - [ ]* 9.8 Write unit tests for committer
    - Test repo mismatch aborts run, missing token aborts run, dry-run makes zero Octokit calls
    - _Requirements: 2.1, 2.3, 2.5, 6.1_

- [x] 10. Implement run orchestrator (`lib/runner.js`)
  - [x] 10.1 Implement `run(config, options, runId)` that resolves commit count, selects target files and messages via rotator, calls `commit` for each (or logs to console in dry-run)
    - Wire together `resolveCommitCount`, `createRotator`, `commit`, and dev-note selection
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 3.6, 6.1_
  - [ ]* 10.2 Write property test for dev-note from pool (P2)
    - **Property 2: Dev-note is always from the configured pool**
    - **Validates: Requirements 1.3**
  - [ ]* 10.3 Write property test for CLI mode override (P9)
    - **Property 9: CLI --mode flag overrides config mode**
    - **Validates: Requirements 3.6, 6.2**
  - [ ]* 10.4 Write unit tests for runner
    - Test dry-run produces zero Octokit calls, mode override from CLI, default mode from config
    - _Requirements: 3.5, 3.6, 6.1_

- [x] 11. Implement CLI entry point (`index.js`)
  - Wire `parseArgs`, `loadConfig`, `generateRunId`, and `run` together
  - Catch all errors at top level: log to `console.error` (full stack only when `DEBUG=1`), then `process.exit(1)`
  - _Requirements: 6.1–6.4, 8.8_

- [x] 12. Create GitHub Actions workflow (`.github/workflows/schedule.yml`)
  - Configure cron `0 9 * * *` and `workflow_dispatch` triggers
  - Use `actions/checkout@v4` and `actions/setup-node@v4` with Node.js 20
  - Run `npm install` then `node index.js`
  - Pass `GITHUB_TOKEN` from `secrets.GRAPH_TOKEN` and set `COMMIT_MODE=realistic`
  - _Requirements: 7.1–7.6_
  - [ ]* 12.1 Write unit tests for workflow file
    - Parse the YAML and assert cron expression, `workflow_dispatch`, action versions, env vars, and execution steps
    - _Requirements: 7.1–7.6_

- [x] 13. Create `config.json` with default values matching the design data model
  - Include all required fields: `repo`, `mode`, `commitsPerDay`, `targetFiles`, `commitMessages`, `devNotes`
  - _Requirements: 8.1–8.7_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per property
- Unit tests use Jest or the Node.js built-in test runner
- Checkpoints ensure incremental validation before wiring steps
