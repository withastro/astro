import type { AstroConfig } from './@types/astro';

import * as colors from 'kleur/colors';
import { promises as fsPromises } from 'fs';
import yargs from 'yargs-parser';

import { loadConfig } from './config.js';
import generate from './generate.js';
import devServer from './dev.js';

const { readFile } = fsPromises;

type Arguments = yargs.Arguments;
type cliState = 'help' | 'version' | 'dev' | 'build';

function resolveArgs(flags: Arguments): cliState {
  if (flags.version) {
    return 'version';
  } else if (flags.help) {
    return 'help';
  }

  const cmd = flags._[2];
  switch (cmd) {
    case 'dev':
      return 'dev';
    case 'build':
      return 'build';
    default:
      return 'help';
  }
}

function printHelp() {
  console.error(`  ${colors.bold('astro')} - Futuristic web development tool.

  ${colors.bold('Commands:')}
  astro dev         Run Astro in development mode.
  astro build       Build a pre-compiled production version of your site.

  ${colors.bold('Flags:')}
  --version         Show the version number and exit.
  --help            Show this help message.
`);
}

async function printVersion() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8'));
  console.error(pkg.version);
}

async function runCommand(rawRoot: string, cmd: (a: AstroConfig) => Promise<void>) {
  const astroConfig = await loadConfig(rawRoot);
  if (typeof astroConfig === 'undefined') {
    console.error(colors.red('  An astro.config.mjs file is required.\n'));
    printHelp();
    process.exit(1);
  }

  return cmd(astroConfig);
}

const cmdMap = new Map([
  ['build', generate],
  ['dev', devServer],
]);

export async function cli(args: string[]) {
  const flags = yargs(args);
  const state = resolveArgs(flags);

  switch (state) {
    case 'help': {
      printHelp();
      process.exit(1);
      break;
    }
    case 'version': {
      await printVersion();
      process.exit(0);
      break;
    }
    case 'build':
    case 'dev': {
      const cmd = cmdMap.get(state)!;
      runCommand(flags._[3], cmd);
    }
  }
}
