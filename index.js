'use strict';

const { parseArgs } = require('./lib/args');
const { loadConfig } = require('./lib/config');
const { generateRunId } = require('./lib/runId');
const { run } = require('./lib/runner');

async function main(argv) {
  const options = parseArgs(argv);
  const config = loadConfig('./config.json');
  const runId = generateRunId();
  await run(config, options, runId);
}

main(process.argv.slice(2)).catch((err) => {
  if (process.env.DEBUG === '1') {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
