/* eslint-disable no-console */
import fs from 'fs';
import * as colors from 'kleur/colors';
import type { Arguments as Flags } from 'yargs-parser';
import yargs from 'yargs-parser';
import { z } from 'zod';
import {
	createSettings,
	openConfig,
	resolveConfigPath,
	resolveFlags,
} from '../core/config/index.js';
import { ASTRO_VERSION } from '../core/constants.js';
import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { createSafeError } from '../core/errors/index.js';
import { debug, error, info, LogOptions } from '../core/logger/core.js';
import { enableVerboseLogging, nodeLogDestination } from '../core/logger/node.js';
import { formatConfigErrorMessage, formatErrorMessage, printHelp } from '../core/messages.js';
import * as event from '../events/index.js';
import { eventConfigError, eventError, telemetry } from '../events/index.js';
import { check } from './check/index.js';
import { openInBrowser } from './open.js';

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
	| 'sync'
	| 'check'
	| 'telemetry';

/** Display --help flag */
function printAstroHelp() {
	printHelp({
		commandName: 'astro',
		usage: '[command] [...flags]',
		headline: 'Build faster websites.',
		tables: {
			Commands: [
				['add', 'Add an integration.'],
				['build', 'Build your project and write it to disk.'],
				['check', 'Check your project for errors.'],
				['dev', 'Start the development server.'],
				['docs', 'Open documentation in your web browser.'],
				['preview', 'Preview your build locally.'],
				['sync', 'Generate content collection types.'],
				['telemetry', 'Configure telemetry settings.'],
			],
			'Global Flags': [
				['--config <path>', 'Specify your config file.'],
				['--root <path>', 'Specify your project root folder.'],
				['--site <url>', 'Specify your project site.'],
				['--base <pathname>', 'Specify your project base.'],
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
	if (cmd === 'sync') return 'sync';
	if (cmd === 'telemetry') return 'telemetry';
	if (flags.version) return 'version';
	else if (flags.help) return 'help';

	const supportedCommands = new Set(['dev', 'build', 'preview', 'check', 'docs']);
	if (supportedCommands.has(cmd)) {
		return cmd as CLICommand;
	}
	return 'help';
}

async function handleConfigError(
	e: any,
	{ cwd, flags, logging }: { cwd?: string; flags?: Flags; logging: LogOptions }
) {
	const path = await resolveConfigPath({ cwd, flags, fs });
	if (e instanceof Error) {
		if (path) {
			error(logging, 'astro', `Unable to load ${colors.bold(path)}\n`);
		}
		console.error(formatErrorMessage(collectErrorMetadata(e)) + '\n');
	}
}

/**
 * Run the given command with the given flags.
 * NOTE: This function provides no error handling, so be sure
 * to present user-friendly error output where the fn is called.
 **/
async function runCommand(cmd: string, flags: yargs.Arguments) {
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
			const { default: add } = await import('../core/add/index.js');

			telemetry.record(event.eventCliSession(cmd));
			const packages = flags._.slice(3) as string[];
			return await add(packages, { cwd: root, flags, logging, telemetry });
		}
		case 'docs': {
			telemetry.record(event.eventCliSession(cmd));
			return await openInBrowser('https://docs.astro.build/');
		}
		case 'telemetry': {
			const telemetryHandler = await import('./telemetry.js');

			// Do not track session start, since the user may be trying to enable,
			// disable, or modify telemetry settings.
			const subcommand = flags._[3]?.toString();
			return await telemetryHandler.update(subcommand, { flags, telemetry });
		}
	}

	let { astroConfig: initialAstroConfig, userConfig: initialUserConfig } = await openConfig({
		cwd: root,
		flags,
		cmd,
		logging,
	}).catch(async (e) => {
		await handleConfigError(e, { cwd: root, flags, logging });
		return {} as any;
	});
	if (!initialAstroConfig) return;
	telemetry.record(event.eventCliSession(cmd, initialUserConfig, flags));
	let settings = createSettings(initialAstroConfig, root);

	// Common CLI Commands:
	// These commands run normally. All commands are assumed to have been handled
	// by the end of this switch statement.
	switch (cmd) {
		case 'dev': {
			const { default: devServer } = await import('../core/dev/index.js');

			const configFlag = resolveFlags(flags).config;
			const configFlagPath = configFlag
				? await resolveConfigPath({ cwd: root, flags, fs })
				: undefined;

			await devServer(settings, {
				configFlag,
				configFlagPath,
				logging,
				telemetry,
				handleConfigError(e) {
					handleConfigError(e, { cwd: root, flags, logging });
					info(logging, 'astro', 'Continuing with previous valid configuration\n');
				},
			});
			return await new Promise(() => {}); // lives forever
		}

		case 'build': {
			const { default: build } = await import('../core/build/index.js');

			return await build(settings, { ...flags, logging, telemetry });
		}

		case 'check': {
			const ret = await check(settings);
			return process.exit(ret);
		}

		case 'sync': {
			const { sync } = await import('./sync/index.js');

			const ret = await sync(settings, { logging, fs });
			return process.exit(ret);
		}

		case 'preview': {
			const { default: preview } = await import('../core/preview/index.js');

			const server = await preview(settings, { logging, telemetry });
			return await server.closed(); // keep alive until the server is closed
		}
	}

	// No command handler matched! This is unexpected.
	throw new Error(`Error running ${cmd} -- no command found.`);
}

/** The primary CLI action */
export async function cli(args: string[]) {
	const flags = yargs(args);
	const cmd = resolveCommand(flags);
	try {
		await runCommand(cmd, flags);
	} catch (err) {
		await throwAndExit(cmd, err);
	}
}

/** Display error and exit */
async function throwAndExit(cmd: string, err: unknown) {
	let telemetryPromise: Promise<any>;
	let errorMessage: string;
	function exitWithErrorMessage() {
		console.error(errorMessage);
		process.exit(1);
	}

	if (err instanceof z.ZodError) {
		telemetryPromise = telemetry.record(eventConfigError({ cmd, err, isFatal: true }));
		errorMessage = formatConfigErrorMessage(err);
	} else {
		const errorWithMetadata = collectErrorMetadata(createSafeError(err));
		telemetryPromise = telemetry.record(eventError({ cmd, err: errorWithMetadata, isFatal: true }));
		errorMessage = formatErrorMessage(errorWithMetadata);
	}

	// Timeout the error reporter (very short) because the user is waiting.
	// NOTE(fks): It is better that we miss some events vs. holding too long.
	// TODO(fks): Investigate using an AbortController once we drop Node v14.
	setTimeout(exitWithErrorMessage, 400);
	// Wait for the telemetry event to send, then exit. Ignore any error.
	await telemetryPromise
		.catch((err2) => debug('telemetry', `record() error: ${err2.message}`))
		.then(exitWithErrorMessage);
}
