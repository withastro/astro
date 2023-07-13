/* eslint-disable no-console */
import * as colors from 'kleur/colors';
import yargs from 'yargs-parser';
import { ASTRO_VERSION } from '../core/constants.js';
import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { createSafeError } from '../core/errors/index.js';
import { debug, type LogOptions } from '../core/logger/core.js';
import { enableVerboseLogging, nodeLogDestination } from '../core/logger/node.js';
import { formatErrorMessage, printHelp } from '../core/messages.js';
import * as event from '../events/index.js';
import { eventError, telemetry } from '../events/index.js';

type Arguments = yargs.Arguments;
type CLICommand =
	| 'help'
	| 'version'
	| 'add'
	| 'docs'
	| 'dev'
	| 'build'
	| 'preview'
	| 'sync'
	| 'check'
	| 'info'
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
				['info', 'List info about your current Astro setup.'],
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
function printVersion() {
	console.log();
	console.log(`  ${colors.bgGreen(colors.black(` astro `))} ${colors.green(`v${ASTRO_VERSION}`)}`);
}

/** Determine which command the user requested */
function resolveCommand(flags: Arguments): CLICommand {
	const cmd = flags._[2] as string;
	if (flags.version) return 'version';

	const supportedCommands = new Set([
		'add',
		'sync',
		'telemetry',
		'dev',
		'build',
		'preview',
		'check',
		'docs',
		'info',
	]);
	if (supportedCommands.has(cmd)) {
		return cmd as CLICommand;
	}
	return 'help';
}

/**
 * Run the given command with the given flags.
 * NOTE: This function provides no error handling, so be sure
 * to present user-friendly error output where the fn is called.
 **/
async function runCommand(cmd: string, flags: yargs.Arguments) {
	const root = flags.root;

	// These commands can run directly without parsing the user config.
	switch (cmd) {
		case 'help':
			printAstroHelp();
			return;
		case 'version':
			printVersion();
			return;
		case 'info': {
			const { printInfo } = await import('./info/index.js');
			await printInfo({ cwd: root, flags });
			return;
		}
		case 'docs': {
			telemetry.record(event.eventCliSession(cmd));
			const { docs } = await import('./docs/index.js');
			await docs({ flags });
			return;
		}
		case 'telemetry': {
			// Do not track session start, since the user may be trying to enable,
			// disable, or modify telemetry settings.
			const { update } = await import('./telemetry/index.js');
			const subcommand = flags._[3]?.toString();
			await update(subcommand, { flags });
			return;
		}
	}

	const logging: LogOptions = {
		dest: nodeLogDestination,
		level: 'info',
	};
	if (flags.verbose) {
		logging.level = 'debug';
		enableVerboseLogging();
	} else if (flags.silent) {
		logging.level = 'silent';
	}

	// Start with a default NODE_ENV so Vite doesn't set an incorrect default when loading the Astro config
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = cmd === 'dev' ? 'development' : 'production';
	}

	// These commands uses the logging and user config. All commands are assumed to have been handled
	// by the end of this switch statement.
	switch (cmd) {
		case 'add': {
			telemetry.record(event.eventCliSession(cmd));
			const { add } = await import('./add/index.js');
			const packages = flags._.slice(3) as string[];
			await add(packages, { cwd: root, flags, logging });
			return;
		}
		case 'dev': {
			const { dev } = await import('./dev/index.js');
			const server = await dev({ flags, logging });
			if (server) {
				return await new Promise(() => {}); // lives forever
			}
			return;
		}
		case 'build': {
			const { build } = await import('./build/index.js');
			await build({ flags, logging });
			return;
		}
		case 'preview': {
			const { preview } = await import('./preview/index.js');
			const server = await preview({ flags, logging });
			if (server) {
				return await server.closed(); // keep alive until the server is closed
			}
			return;
		}
		case 'check': {
			const { check } = await import('./check/index.js');
			// We create a server to start doing our operations
			const checkServer = await check({ flags, logging });
			if (checkServer) {
				if (checkServer.isWatchMode) {
					await checkServer.watch();
					return await new Promise(() => {}); // lives forever
				} else {
					let checkResult = await checkServer.check();
					return process.exit(checkResult);
				}
			}
			return;
		}
		case 'sync': {
			const { sync } = await import('./sync/index.js');
			const exitCode = await sync({ flags, logging });
			return process.exit(exitCode);
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

	const errorWithMetadata = collectErrorMetadata(createSafeError(err));
	telemetryPromise = telemetry.record(eventError({ cmd, err: errorWithMetadata, isFatal: true }));
	errorMessage = formatErrorMessage(errorWithMetadata);

	// Timeout the error reporter (very short) because the user is waiting.
	// NOTE(fks): It is better that we miss some events vs. holding too long.
	// TODO(fks): Investigate using an AbortController once we drop Node v14.
	setTimeout(exitWithErrorMessage, 400);
	// Wait for the telemetry event to send, then exit. Ignore any error.
	await telemetryPromise
		.catch((err2) => debug('telemetry', `record() error: ${err2.message}`))
		.then(exitWithErrorMessage);
}
