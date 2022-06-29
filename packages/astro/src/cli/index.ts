/* eslint-disable no-console */

import { LogOptions } from '../core/logger/core.js';
import * as colors from 'kleur/colors';
import yargs from 'yargs-parser';
import { z } from 'zod';
import { telemetry } from '../events/index.js';
import * as event from '../events/index.js';
import add from '../core/add/index.js';
import build from '../core/build/index.js';
import { openConfig } from '../core/config.js';
import devServer from '../core/dev/index.js';
import { enableVerboseLogging, nodeLogDestination } from '../core/logger/node.js';
import { formatConfigErrorMessage, formatErrorMessage, printHelp } from '../core/messages.js';
import preview from '../core/preview/index.js';
import { createSafeError, ASTRO_VERSION } from '../core/util.js';
import { check } from './check.js';
import { openInBrowser } from './open.js';
import * as telemetryHandler from './telemetry.js';
import { collectErrorMetadata } from '../core/errors.js';
import { eventError, eventConfigError } from '../events/index.js';

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
		usage: '[command] [...flags]',
		headline: 'Futuristic web development tool.',
		tables: {
			Commands: [
				['add', 'Add an integration.'],
				['build', 'Build your project and write it to disk.'],
				['check', 'Check your project for errors.'],
				['dev', 'Start the development server.'],
				['docs', 'Open documentation in your web browser.'],
				['preview', 'Preview your build locally.'],
				['telemetry', 'Configure telemetry settings.'],
			],
			'Global Flags': [
				['--config <path>', 'Specify your config file.'],
				['--root <path>', 'Specify your project root folder.'],
				['--verbose', 'Enable verbose logging.'],
				['--silent', 'Disable all logging.'],
				['--version', 'Show the version number and exit.'],
				['--help', 'Show this help message.'],
			],
		},
	});
}

/** Display --version flag */
async function printVersion() {
	console.log();
	console.log(`  ${colors.bgGreen(colors.black(` astro `))} ${colors.green(`v${ASTRO_VERSION}`)}`);
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

	// Special CLI Commands: "add", "docs", "telemetry"
	// These commands run before the user's config is parsed, and may have other special
	// conditions that should be handled here, before the others.
	//
	switch (cmd) {
		case 'add': {
			try {
				telemetry.record(event.eventCliSession(cmd));
				const packages = flags._.slice(3) as string[];
				return await add(packages, { cwd: root, flags, logging, telemetry });
			} catch (err) {
				return throwAndExit(cmd, err);
			}
		}
		case 'docs': {
			try {
				telemetry.record(event.eventCliSession(cmd));
				return await openInBrowser('https://docs.astro.build/');
			} catch (err) {
				return throwAndExit(cmd, err);
			}
		}
		case 'telemetry': {
			try {
				// Do not track session start, since the user may be trying to enable,
				// disable, or modify telemetry settings.
				const subcommand = flags._[3]?.toString();
				return await telemetryHandler.update(subcommand, { flags, telemetry });
			} catch (err) {
				return throwAndExit(cmd, err);
			}
		}
	}

	const { astroConfig, userConfig } = await openConfig({ cwd: root, flags, cmd });
	telemetry.record(event.eventCliSession(cmd, userConfig, flags));

	// Common CLI Commands:
	// These commands run normally. All commands are assumed to have been handled
	// by the end of this switch statement.
	switch (cmd) {
		case 'dev': {
			try {
				await devServer(astroConfig, { logging, telemetry });
				return await new Promise(() => {}); // lives forever
			} catch (err) {
				return throwAndExit(cmd, err);
			}
		}

		case 'build': {
			try {
				return await build(astroConfig, { logging, telemetry });
			} catch (err) {
				return throwAndExit(cmd, err);
			}
		}

		case 'check': {
			const ret = await check(astroConfig);
			return process.exit(ret);
		}

		case 'preview': {
			try {
				const server = await preview(astroConfig, { logging, telemetry });
				return await server.closed(); // keep alive until the server is closed
			} catch (err) {
				return throwAndExit(cmd, err);
			}
		}
	}

	// No command handler matched! This is unexpected.
	throwAndExit(cmd, new Error(`Error running ${cmd} -- no command found.`));
}

/** Display error and exit */
function throwAndExit(cmd: string, err: unknown) {
	let telemetryPromise: Promise<any>;
	if (err instanceof z.ZodError) {
		console.error(formatConfigErrorMessage(err));
		telemetryPromise = telemetry.record(eventConfigError({ cmd, err, isFatal: true }));
	} else {
		const errorWithMetadata = collectErrorMetadata(createSafeError(err));
		console.error(formatErrorMessage(errorWithMetadata));
		telemetryPromise = telemetry.record(eventError({ cmd, err: errorWithMetadata, isFatal: true }));
	}
	// Wait for the telemetry event to send, then exit. Ignore an error.
	telemetryPromise.catch(() => undefined).then(() => process.exit(1));
	// Don't wait too long. Timeout the request faster than usual because the user is waiting.
	// TODO: Investigate using an AbortController once we drop Node v14 support.
	setTimeout(() => process.exit(1), 300);
}
