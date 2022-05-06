/* eslint-disable no-console */

import type { AstroConfig } from '../@types/astro';
import { LogOptions } from '../core/logger/core.js';

import * as colors from 'kleur/colors';
import yargs from 'yargs-parser';
import { z } from 'zod';
import { AstroTelemetry } from '@astrojs/telemetry';
import * as event from '@astrojs/telemetry/events';

import { nodeLogDestination, enableVerboseLogging } from '../core/logger/node.js';
import build from '../core/build/index.js';
import add from '../core/add/index.js';
import devServer from '../core/dev/index.js';
import preview from '../core/preview/index.js';
import { check } from './check.js';
import { openInBrowser } from './open.js';
import * as telemetryHandler from './telemetry.js';
import { openConfig } from '../core/config.js';
import { printHelp, formatErrorMessage, formatConfigErrorMessage } from '../core/messages.js';
import { createSafeError } from '../core/util.js';

type Arguments = yargs.Arguments;
type CLICommand =
	| 'help'
	| 'version'
	| 'add'
	| 'docs'
	| 'dev'
	| 'build'
	| 'preview'
	| 'reload'
	| 'check'
	| 'telemetry';

/** Display --help flag */
function printAstroHelp() {
	printHelp({
		commandName: 'astro',
		headline: 'Futuristic web development tool.',
		commands: [
			['add', 'Add an integration to your configuration.'],
			['docs', "Launch Astro's Doc site directly from the terminal. "],
			['dev', 'Run Astro in development mode.'],
			['build', 'Build a pre-compiled production-ready site.'],
			['preview', 'Preview your build locally before deploying.'],
			['check', 'Check your project for errors.'],
			['telemetry', 'Enable/disable anonymous data collection.'],
			['--version', 'Show the version number and exit.'],
			['--help', 'Show this help message.'],
		],
		flags: [
			['--host [optional IP]', 'Expose server on network'],
			['--config <path>', 'Specify the path to the Astro config file.'],
			['--root <path>', 'Specify the path to the project root folder.'],
			['--drafts', 'Include markdown draft pages in the build.'],
			['--verbose', 'Enable verbose logging'],
			['--silent', 'Disable logging'],
		],
	});
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
	const cmd = flags._[2] as string;
	if (cmd === 'add') return 'add';
	if (cmd === 'telemetry') return 'telemetry';
	if (flags.version) return 'version';
	else if (flags.help) return 'help';

	const supportedCommands = new Set(['dev', 'build', 'preview', 'check', 'docs']);
	if (supportedCommands.has(cmd)) {
		return cmd as CLICommand;
	}
	return 'help';
}

/** The primary CLI action */
export async function cli(args: string[]) {
	const flags = yargs(args);
	const cmd = resolveCommand(flags);
	const root = flags.root;

	switch (cmd) {
		case 'help':
			printAstroHelp();
			return process.exit(0);
		case 'version':
			await printVersion();
			return process.exit(0);
	}

	// logLevel
	let logging: LogOptions = {
		dest: nodeLogDestination,
		level: 'info',
	};
	if (flags.verbose) {
		logging.level = 'debug';
		enableVerboseLogging();
	} else if (flags.silent) {
		logging.level = 'silent';
	}
	const telemetry = new AstroTelemetry({ version: process.env.PACKAGE_VERSION ?? '' });

	if (cmd === 'telemetry') {
		try {
			const subcommand = flags._[3]?.toString();
			return await telemetryHandler.update(subcommand, { flags, telemetry });
		} catch (err) {
			return throwAndExit(err);
		}
	}

	switch (cmd) {
		case 'add': {
			try {
				const packages = flags._.slice(3) as string[];
				telemetry.record(
					event.eventCliSession({
						astroVersion: process.env.PACKAGE_VERSION ?? '',
						cliCommand: 'add',
					})
				);
				return await add(packages, { cwd: root, flags, logging, telemetry });
			} catch (err) {
				return throwAndExit(err);
			}
		}
		case 'dev': {
			try {
				const { astroConfig, userConfig } = await openConfig({ cwd: root, flags, cmd });

				telemetry.record(
					event.eventCliSession(
						{ astroVersion: process.env.PACKAGE_VERSION ?? '', cliCommand: 'dev' },
						userConfig,
						flags
					)
				);
				await devServer(astroConfig, { logging, telemetry });
				return await new Promise(() => {}); // lives forever
			} catch (err) {
				return throwAndExit(err);
			}
		}

		case 'build': {
			try {
				const { astroConfig, userConfig } = await openConfig({ cwd: root, flags, cmd });
				telemetry.record(
					event.eventCliSession(
						{ astroVersion: process.env.PACKAGE_VERSION ?? '', cliCommand: 'build' },
						userConfig,
						flags
					)
				);
				return await build(astroConfig, { logging, telemetry });
			} catch (err) {
				return throwAndExit(err);
			}
		}

		case 'check': {
			const { astroConfig, userConfig } = await openConfig({ cwd: root, flags, cmd });
			telemetry.record(
				event.eventCliSession(
					{ astroVersion: process.env.PACKAGE_VERSION ?? '', cliCommand: 'check' },
					userConfig,
					flags
				)
			);
			const ret = await check(astroConfig);
			return process.exit(ret);
		}

		case 'preview': {
			try {
				const { astroConfig, userConfig } = await openConfig({ cwd: root, flags, cmd });
				telemetry.record(
					event.eventCliSession(
						{ astroVersion: process.env.PACKAGE_VERSION ?? '', cliCommand: 'preview' },
						userConfig,
						flags
					)
				);
				const server = await preview(astroConfig, { logging, telemetry });
				return await server.closed(); // keep alive until the server is closed
			} catch (err) {
				return throwAndExit(err);
			}
		}

		case 'docs': {
			try {
				await telemetry.record(
					event.eventCliSession({
						astroVersion: process.env.PACKAGE_VERSION ?? '',
						cliCommand: 'docs',
					})
				);
				return await openInBrowser('https://docs.astro.build/');
			} catch (err) {
				return throwAndExit(err);
			}
		}

		default: {
			throw new Error(`Error running ${cmd}`);
		}
	}
}

/** Display error and exit */
function throwAndExit(err: unknown) {
	if (err instanceof z.ZodError) {
		console.error(formatConfigErrorMessage(err));
	} else {
		console.error(formatErrorMessage(createSafeError(err)));
	}
	process.exit(1);
}
