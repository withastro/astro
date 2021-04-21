/* eslint-disable no-console */
import type { AstroConfig } from './@types/astro';

import * as colors from 'kleur/colors';
import { promises as fsPromises } from 'fs';
import yargs from 'yargs-parser';

import { loadConfig } from './config.js';
import { build } from './build.js';
import devServer from './dev.js';

const { readFile } = fsPromises;
const buildAndExit = async (...args: Parameters<typeof build>) => {
  const ret = await build(...args);
  process.exit(ret);
};

type Arguments = yargs.Arguments;
type cliCommand = 'help' | 'version' | 'dev' | 'build';
interface CLIState {
  cmd: cliCommand;
  options: {
    sitemap?: boolean;
  };
}

/** Determine which action the user requested */
function resolveArgs(flags: Arguments): CLIState {
  const options: CLIState['options'] = {
    sitemap: typeof flags.sitemap === 'boolean' ? flags.sitemap : undefined,
  };

  if (flags.version) {
    return { cmd: 'version', options };
  } else if (flags.help) {
    return { cmd: 'help', options };
  }

  const cmd = flags._[2];
  switch (cmd) {
    case 'dev':
      return { cmd: 'dev', options };
    case 'build':
      return { cmd: 'build', options };
    default:
      return { cmd: 'help', options };
  }
}

/** Display --help flag */
function printHelp() {
  console.error(`  ${colors.bold('astro')} - Futuristic web development tool.

  ${colors.bold('Commands:')}
  astro dev         Run Astro in development mode.
  astro build       Build a pre-compiled production version of your site.

  ${colors.bold('Flags:')}
  --version         Show the version number and exit.
  --help            Show this help message.
  --no-sitemap      Disable sitemap generation (build only).
`);
}

/** Display --version flag */
async function printVersion() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8'));
  console.error(pkg.version);
}

/** Merge CLI flags & config options (CLI flags take priority) */
function mergeCLIFlags(astroConfig: AstroConfig, flags: CLIState['options']) {
  if (typeof flags.sitemap === 'boolean') astroConfig.sitemap = flags.sitemap;
}

/** Handle `astro run` command */
async function runCommand(rawRoot: string, cmd: (a: AstroConfig) => Promise<void>, options: CLIState['options']) {
  try {
    const astroConfig = await loadConfig(rawRoot);
    mergeCLIFlags(astroConfig, options);
    return cmd(astroConfig);
  } catch (err) {
    console.error(colors.red(err.toString() || err));
    process.exit(1);
  }
}

const cmdMap = new Map([
  ['build', buildAndExit],
  ['dev', devServer],
]);

/** The primary CLI action */
export async function cli(args: string[]) {
  const flags = yargs(args);
  const state = resolveArgs(flags);

  switch (state.cmd) {
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cmd = cmdMap.get(state.cmd)!;
      runCommand(flags._[3], cmd, state.options);
    }
  }
}
