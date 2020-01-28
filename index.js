#!/usr/bin/env node
const { execSync } = require('child_process');


const extractDiff = (argv) => {
  const { dir, branch } = argv;

  console.log('exec', execSync('git show master:package.json'))
}

require('yargs')
  .scriptName('podiff')
  .usage('$0 [options]')
  .command(
    '$0',
    'extracts the diff between a PO file on a branch against that on another branch',
    {
      dir: {
        type: 'string',
        alias: 'd',
        default: './',
        required: true,
        description: 'directory where PO files are located',
      },
      branch: {
        type: 'string',
        alias: 'b',
        default: 'master',
        description: 'branch to compare PO file with',
      },
    },
    extractDiff,
  )
  .env()
  .help().argv;

