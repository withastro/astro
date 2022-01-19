/* eslint-disable no-console */

import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from '../core/logger';

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
type cliCommand = 'help' | 'version' | 'dev' | 'build' | 'preview' | 'reload' | 'check';
interface CLIState {
	cmd: cliCommand;
	options: {
		projectRoot?: string;
		site?: string;
		sitemap?: boolean;
		hostname?: string;
		port?: number;
		config?: string;
		experimentalStaticBuild?: boolean;
		drafts?: boolean;
	};
}

/** Determine which action the user requested */
function resolveArgs(flags: Arguments): CLIState {
	const options: CLIState['options'] = {
		projectRoot: typeof flags.projectRoot === 'string' ? flags.projectRoot : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		sitemap: typeof flags.sitemap === 'boolean' ? flags.sitemap : undefined,
		port: typeof flags.port === 'number' ? flags.port : undefined,
		config: typeof flags.config === 'string' ? flags.config : undefined,
		hostname: typeof flags.hostname === 'string' ? flags.hostname : undefined,
		experimentalStaticBuild: typeof flags.experimentalStaticBuild === 'boolean' ? flags.experimentalStaticBuild : false,
		drafts: typeof flags.drafts === 'boolean' ? flags.drafts : false,
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
		case 'preview':
			return { cmd: 'preview', options };
		case 'check':
			return { cmd: 'check', options };
		default:
			return { cmd: 'help', options };
	}
}

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

/** Merge CLI flags & config options (CLI flags take priority) */
function mergeCLIFlags(astroConfig: AstroConfig, flags: CLIState['options']) {
	if (typeof flags.sitemap === 'boolean') astroConfig.buildOptions.sitemap = flags.sitemap;
	if (typeof flags.site === 'string') astroConfig.buildOptions.site = flags.site;
	if (typeof flags.port === 'number') astroConfig.devOptions.port = flags.port;
	if (typeof flags.hostname === 'string') astroConfig.devOptions.hostname = flags.hostname;
	if (typeof flags.experimentalStaticBuild === 'boolean') astroConfig.buildOptions.experimentalStaticBuild = flags.experimentalStaticBuild;
	if (typeof flags.drafts === 'boolean') astroConfig.buildOptions.drafts = flags.drafts;
}

/** The primary CLI action */
export async function cli(args: string[]) {
	const flags = yargs(args);
	const state = resolveArgs(flags);
	const options = { ...state.options };
	const projectRoot = options.projectRoot || flags._[3];

	switch (state.cmd) {
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

	if (flags.verbose) logging.level = 'debug';
	if (flags.silent) logging.level = 'silent';
	let config: AstroConfig;
	try {
		config = await loadConfig({ cwd: projectRoot, filename: options.config });
		mergeCLIFlags(config, options);
	} catch (err) {
		if (err instanceof z.ZodError) {
			console.error(formatConfigError(err));
		} else {
			console.error(colors.red((err as any).toString() || err));
		}
		process.exit(1);
	}

	switch (state.cmd) {
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
			throw new Error(`Error running ${state.cmd}`);
		}
	}
}

/** Display error and exit */
function throwAndExit(err: any) {
	console.error(colors.red(err.toString() || err));
	process.exit(1);
}
