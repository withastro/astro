/* eslint-disable no-console */

import type { AstroConfig } from '../@types/astro';
import { enableVerboseLogging, LogOptions } from '../core/logger.js';

import * as colors from 'kleur/colors';
import fs from 'fs';
import yargs from 'yargs-parser';
import { z } from 'zod';
import { defaultLogDestination } from '../core/logger.js';
import build from '../core/build/index.js';
import devServer from '../core/dev/index.js';
import preview from '../core/preview/index.js';
import { check } from './check.js';
import { formatConfigError, loadConfig } from '../core/config.js';

type Arguments = yargs.Arguments;
type CLICommand = 'help' | 'version' | 'dev' | 'build' | 'preview' | 'reload' | 'check';

/** Display --help flag */
function printHelp() {
	console.log(`  ${colors.bold('astro')} - Futuristic web development tool.
  ${colors.bold('Commands:')}
  astro dev             Run Astro in development mode.
  astro build           Build a pre-compiled production version of your site.
  astro preview         Preview your build locally before deploying.
  astro check           Check your project for errors.

  ${colors.bold('Flags:')}
  --config <path>				Specify the path to the Astro config file.
  --project-root <path>			Specify the path to the project root folder.
  --no-sitemap					Disable sitemap generation (build only).
  --experimental-static-build	A more performant build that expects assets to be define statically.
	--experimental-ssr		Enable SSR compilation.
  --drafts                      Include markdown draft pages in the build.
  --verbose						Enable verbose logging
  --silent						Disable logging
  --version						Show the version number and exit.
  --help						Show this help message.
`);
}

/** Display --version flag */
async function printVersion() {
	const pkgURL = new URL('../../package.json', import.meta.url);
	const pkg = JSON.parse(await fs.promises.readFile(pkgURL, 'utf8'));
	const pkgVersion = pkg.version;

	console.log(pkgVersion);
}

/** Determine which command the user requested */
function resolveCommand(flags: Arguments): CLICommand {
	if (flags.version) {
		return 'version';
	} else if (flags.help) {
		return 'help';
	}
	const cmd = flags._[2];
	const supportedCommands = new Set(['dev', 'build', 'preview', 'check']);
	if (supportedCommands.has(cmd)) {
		return cmd as 'dev' | 'build' | 'preview' | 'check';
	}
	return 'help';
}

/** The primary CLI action */
export async function cli(args: string[]) {
	const flags = yargs(args);
	const cmd = resolveCommand(flags);
	const projectRoot = flags.projectRoot || flags._[3];

	switch (cmd) {
		case 'help':
			printHelp();
			return process.exit(0);
		case 'version':
			await printVersion();
			return process.exit(0);
	}

	// logLevel
	let logging: LogOptions = {
		dest: defaultLogDestination,
		level: 'info',
	};
	if (flags.verbose) {
		logging.level = 'debug';
		enableVerboseLogging();
	} else if (flags.silent) {
		logging.level = 'silent';
	}

	let config: AstroConfig;
	try {
		config = await loadConfig({ cwd: projectRoot, flags });
	} catch (err) {
		throwAndExit(err);
		return;
	}

	switch (cmd) {
		case 'dev': {
			try {
				await devServer(config, { logging });

				await new Promise(() => {}); // don’t close dev server
			} catch (err) {
				throwAndExit(err);
			}

			return;
		}

		case 'build': {
			try {
				await build(config, { logging });
				process.exit(0);
			} catch (err) {
				throwAndExit(err);
			}
			return;
		}

		case 'check': {
			const ret = await check(config);
			return process.exit(ret);
		}

		case 'preview': {
			try {
				await preview(config, { logging }); // this will keep running
			} catch (err) {
				throwAndExit(err);
			}
			return;
		}

		default: {
			throw new Error(`Error running ${cmd}`);
		}
	}
}

/** Display error and exit */
function throwAndExit(err: any) {
	if (err instanceof z.ZodError) {
		console.error(formatConfigError(err));
	} else if (err.stack) {
		const [mainMsg, ...stackMsg] = err.stack.split('\n');
		console.error(colors.red(mainMsg) + '\n' + colors.dim(stackMsg.join('\n')));
	} else {
		console.error(colors.red(err.toString() || err));
	}
	process.exit(1);
}
