/* eslint-disable no-console */

import type { AstroConfig } from '../@types/astro';
import { enableVerboseLogging, LogOptions } from '../core/logger.js';

import * as colors from 'kleur/colors';
import yargs from 'yargs-parser';
import { z } from 'zod';
import { defaultLogDestination } from '../core/logger.js';
import build from '../core/build/index.js';
import devServer from '../core/dev/index.js';
import preview from '../core/preview/index.js';
import { check } from './check.js';
import { formatConfigError, loadConfig } from '../core/config.js';
import { pad } from '../core/dev/util.js';

type Arguments = yargs.Arguments;
type CLICommand = 'help' | 'version' | 'dev' | 'build' | 'preview' | 'reload' | 'check';

/** Display --help flag */
function printHelp() {
	linebreak();
	headline('astro', 'Futuristic web development tool.');
	linebreak();
	title('Commands');
	table(
		[
			['dev', 'Run Astro in development mode.'],
			['build', 'Build a pre-compiled production-ready site.'],
			['preview', 'Preview your build locally before deploying.'],
			['check', 'Check your project for errors.'],
			['--version', 'Show the version number and exit.'],
			['--help', 'Show this help message.'],
		],
		{ padding: 28, prefix: '  astro ' }
	);
	linebreak();
	title('Flags');
	table(
		[
			['--config <path>', 'Specify the path to the Astro config file.'],
			['--project-root <path>', 'Specify the path to the project root folder.'],
			['--no-sitemap', 'Disable sitemap generation (build only).'],
			['--legacy-build', 'Use the build strategy prior to 0.24.0'],
			['--experimental-ssr', 'Enable SSR compilation.'],
			['--drafts', 'Include markdown draft pages in the build.'],
			['--verbose', 'Enable verbose logging'],
			['--silent', 'Disable logging'],
		],
		{ padding: 28, prefix: '  ' }
	);

	// Logging utils
	function linebreak() {
		console.log();
	}

	function headline(name: string, tagline: string) {
		console.log(`  ${colors.bgGreen(colors.black(` ${name} `))} ${colors.green(`v${process.env.PACKAGE_VERSION ?? ''}`)} ${tagline}`);
	}
	function title(label: string) {
		console.log(`  ${colors.bgWhite(colors.black(` ${label} `))}`);
	}
	function table(rows: [string, string][], opts: { padding: number; prefix: string }) {
		const split = rows.some((row) => {
			const message = `${opts.prefix}${' '.repeat(opts.padding)}${row[1]}`;
			return message.length > process.stdout.columns;
		});
		for (const row of rows) {
			row.forEach((col, i) => {
				if (i === 0) {
					process.stdout.write(`${opts.prefix}${colors.bold(pad(`${col}`, opts.padding - opts.prefix.length))}`);
				} else {
					if (split) {
						process.stdout.write('\n    ');
					}
					process.stdout.write(colors.dim(col) + '\n');
				}
			});
		}
		return '';
	}
}

/** Display --version flag */
async function printVersion() {
	// PACKAGE_VERSION is injected at build time
	const version = process.env.PACKAGE_VERSION ?? '';
	console.log();
	console.log(`  ${colors.bgGreen(colors.black(` astro `))} ${colors.green(`v${version}`)}`);
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
