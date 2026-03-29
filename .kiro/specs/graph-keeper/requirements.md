# Requirements Document

## Introduction

graph-keeper is a Node.js automation tool that makes small, harmless commits to a dedicated GitHub repository on a configurable daily schedule. Its sole purpose is to keep the GitHub contribution graph consistently green. It never touches real project code — only appends lightweight log entries to safe, isolated files. The tool runs via GitHub Actions (free tier, no server required) and supports multiple commit frequency modes: Steady, Burst, Realistic, and Custom pattern.

## Glossary

- **graph-keeper**: The Node.js automation tool described in this document.
- **Scheduler**: The GitHub Actions workflow that triggers graph-keeper on a cron schedule.
- **Committer**: The component responsible for writing files and pushing commits via the GitHub API.
- **Config**: The `config.json` file containing user-defined settings for graph-keeper.
- **Mode**: The commit frequency strategy — one of `steady`, `burst`, `realistic`, or `custom`.
- **Run**: A single execution of graph-keeper triggered by the Scheduler or manually.
- **RunId**: A 6-character random hexadecimal string uniquely identifying each Run.
- **Target_File**: A safe log file (`.md`, `.json`, or `.txt`) that the Committer is permitted to modify.
- **Dedicated_Repo**: The isolated GitHub repository (e.g. `your-username/dev-activity`) used exclusively by graph-keeper.
- **Pattern_Grid**: A 52×7 JSON array of integers (0–4) representing a pixel-art commit intensity map.
- **Octokit**: The `@octokit/rest` GitHub REST API client used by the Committer.
- **Dry_Run**: An execution mode where all actions are logged to the console without making API calls or file writes.

---

## Requirements

### Requirement 1: Core Commit Execution

**User Story:** As a developer, I want graph-keeper to automatically append log entries and push commits to my dedicated repository each day, so that my GitHub contribution graph stays green without manual effort.

#### Acceptance Criteria

1. WHEN a Run is triggered, THE Committer SHALL append a timestamped entry to `changelog.md`.
2. WHEN a Run is triggered, THE Committer SHALL push a JSON object containing `date`, `time`, `runId`, `mode`, and `commitIndex` to `data/activity-log.json`.
3. WHEN a Run is triggered, THE Committer SHALL append a randomly selected dev-note from the configured pool to `notes/daily.md`.
4. THE Committer SHALL use Octokit to perform all file writes and commits, not the git CLI.
5. THE Committer SHALL only write to files with extensions `.md`, `.json`, or `.txt`.
6. IF a Target_File does not exist in the Dedicated_Repo, THEN THE Committer SHALL create it before appending content.

---

### Requirement 2: Commit Safety and Isolation

**User Story:** As a developer, I want graph-keeper to be strictly isolated to a dedicated repository, so that my real project code is never accidentally modified.

#### Acceptance Criteria

1. THE Committer SHALL only commit to the repository specified in the `repo` field of Config.
2. THE Committer SHALL never modify files with extensions `.js`, `.ts`, `.py`, or `.env`, or files named `package.json`.
3. THE graph-keeper SHALL read the GitHub token exclusively from the `GITHUB_TOKEN` environment variable.
4. THE graph-keeper SHALL never write the GitHub token to any file.
5. IF the `repo` field in Config does not match the Dedicated_Repo, THEN THE Committer SHALL abort the Run and log an error.

---

### Requirement 3: Commit Modes

**User Story:** As a developer, I want to choose how many commits are made per day, so that my contribution graph looks natural and matches my preferred style.

#### Acceptance Criteria

1. WHEN Mode is `steady`, THE Committer SHALL make exactly 1 commit per Run.
2. WHEN Mode is `burst`, THE Committer SHALL make a random number of commits between 3 and 8 (inclusive) per Run.
3. WHEN Mode is `realistic`, THE Committer SHALL make a weighted random number of commits between 0 and 5 per Run, with occasional days producing 0 commits.
4. WHERE Mode is `custom`, THE Committer SHALL read a Pattern_Grid from the file specified by the `--pattern` CLI flag and commit at the intensity level corresponding to the current day's cell in the grid.
5. THE graph-keeper SHALL default to the Mode specified in Config when no `--mode` CLI flag is provided.
6. WHEN the `--mode` CLI flag is provided, THE graph-keeper SHALL override the Config Mode for that Run only.

---

### Requirement 4: Commit Message Rotation

**User Story:** As a developer, I want commit messages to rotate so that the commit history looks natural and not robotic.

#### Acceptance Criteria

1. THE Committer SHALL select commit messages from the `commitMessages` array defined in Config.
2. THE Committer SHALL not use the same commit message as the immediately preceding commit within a single Run.
3. THE Committer SHALL rotate through available messages in a non-repeating sequence within a Run when multiple commits are made.

---

### Requirement 5: Unique Run Identification

**User Story:** As a developer, I want each run to have a unique identifier, so that I can trace log entries back to specific executions.

#### Acceptance Criteria

1. WHEN a Run begins, THE graph-keeper SHALL generate a RunId consisting of exactly 6 random hexadecimal characters.
2. THE Committer SHALL include the RunId in every log entry written to `data/activity-log.json` during that Run.

---

### Requirement 6: CLI Interface

**User Story:** As a developer, I want to control graph-keeper from the command line, so that I can test, override, and automate it flexibly.

#### Acceptance Criteria

1. WHEN the `--dry-run` flag is provided, THE graph-keeper SHALL log all planned actions to the console without making any API calls or file writes.
2. WHEN the `--mode <value>` flag is provided, THE graph-keeper SHALL use the specified Mode for that Run, overriding Config.
3. WHEN the `--pattern <file>` flag is provided, THE graph-keeper SHALL load the Pattern_Grid from the specified file path and activate `custom` Mode.
4. IF an unrecognised CLI flag is provided, THEN THE graph-keeper SHALL log a descriptive error message and exit with a non-zero status code.

---

### Requirement 7: GitHub Actions Scheduler

**User Story:** As a developer, I want graph-keeper to run automatically every day via GitHub Actions, so that I don't need a server or manual intervention.

#### Acceptance Criteria

1. THE Scheduler SHALL trigger a Run at 09:00 UTC every day using a cron expression.
2. THE Scheduler SHALL support manual triggering via `workflow_dispatch`.
3. THE Scheduler SHALL use `actions/checkout@v4` and `actions/setup-node@v4` with Node.js version 20.
4. THE Scheduler SHALL run `npm install` followed by `node index.js` as the execution steps.
5. THE Scheduler SHALL pass the `GITHUB_TOKEN` environment variable to graph-keeper using the `secrets.GRAPH_TOKEN` Actions secret.
6. THE Scheduler SHALL set the `COMMIT_MODE` environment variable to `realistic` by default.

---

### Requirement 8: Configuration

**User Story:** As a developer, I want a single config file to control all graph-keeper behaviour, so that I can customise it without touching the code.

#### Acceptance Criteria

1. THE graph-keeper SHALL read all runtime settings from `config.json` at the start of each Run.
2. THE Config SHALL include a `repo` field identifying the Dedicated_Repo.
3. THE Config SHALL include a `mode` field specifying the default Mode.
4. THE Config SHALL include a `commitsPerDay` object with sub-keys for `steady`, `burst`, and `realistic` defining their respective commit counts or ranges.
5. THE Config SHALL include a `targetFiles` array listing the Target_Files the Committer is permitted to modify.
6. THE Config SHALL include a `commitMessages` array of at least two distinct message strings.
7. THE Config SHALL include a `devNotes` array of at least two distinct note strings used for `notes/daily.md` entries.
8. IF `config.json` is missing or malformed, THEN THE graph-keeper SHALL log a descriptive error and exit with a non-zero status code.

---

### Requirement 9: Environment Variable Documentation

**User Story:** As a developer, I want a documented example of required environment variables, so that I can set up the tool quickly without reading the full source code.

#### Acceptance Criteria

1. THE graph-keeper repository SHALL include a `.env.example` file listing all required environment variable names with placeholder values.
2. THE `.env.example` file SHALL include `GITHUB_TOKEN` and `COMMIT_MODE` as documented variables.

---

### Requirement 10: Pattern Grid Parsing (Custom Mode)

**User Story:** As a developer, I want to supply a 52×7 intensity grid to draw pixel art on my contribution graph, so that I can create a personalised visual pattern.

#### Acceptance Criteria

1. WHEN `--pattern <file>` is provided, THE graph-keeper SHALL parse the file as a JSON array of 52 arrays each containing exactly 7 integers in the range 0–4.
2. IF the Pattern_Grid file is missing, THEN THE graph-keeper SHALL log a descriptive error and exit with a non-zero status code.
3. IF the Pattern_Grid does not conform to the 52×7 structure or contains values outside 0–4, THEN THE graph-keeper SHALL log a descriptive validation error and exit with a non-zero status code.
4. THE graph-keeper SHALL parse then re-serialise a valid Pattern_Grid and produce an equivalent object (round-trip property).
5. WHEN the intensity value for the current day is 0, THE Committer SHALL skip committing for that day.
6. WHEN the intensity value for the current day is between 1 and 4 (inclusive), THE Committer SHALL make exactly that many commits.
