import { parseArgs } from 'node:util';
/* eslint-disable no-console */
import * as colors from 'kleur/colors';
import { ASTRO_VERSION } from '../core/constants.js';
import type { ParsedArgsResult } from './flags.js';

type CLICommand =
	| 'help'
	| 'version'
	| 'add'
	| 'docs'
	| 'dev'
	| 'build'
	| 'preview'
	| 'db'
	| 'sync'
	| 'check'
	| 'info'
	| 'preferences'
	| 'telemetry';

/** Display --help flag */
async function printAstroHelp() {
	const { printHelp } = await import('../core/messages.js');
	printHelp({
		commandName: 'astro',
		usage: '[command] [...flags]',
		headline: 'Build faster websites.',
		tables: {
			Commands: [
				['add', 'Add an integration.'],
				['build', 'Build your project and write it to disk.'],
				['check', 'Check your project for errors.'],
				['db', 'Manage your Astro database.'],
				['dev', 'Start the development server.'],
				['docs', 'Open documentation in your web browser.'],
				['info', 'List info about your current Astro setup.'],
				['preview', 'Preview your build locally.'],
				['sync', 'Generate content collection types.'],
				['preferences', 'Configure user preferences.'],
				['telemetry', 'Configure telemetry settings.'],
			],
			'Studio Commands': [
				['login', 'Authenticate your machine with Astro Studio.'],
				['logout', 'End your authenticated session with Astro Studio.'],
				['link', 'Link this project directory to an Astro Studio project.'],
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
function resolveCommand(args: ParsedArgsResult): CLICommand {
	const cmd = args.positionals[2] as string;
	if (args.values.version) return 'version';

	const supportedCommands = new Set([
		'add',
		'sync',
		'telemetry',
		'preferences',
		'dev',
		'build',
		'preview',
		'check',
		'docs',
		'db',
		'info',
		'login',
		'loutout',
		'link',
		'init',
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
async function runCommand(cmd: string, args: ParsedArgsResult) {
	const flags = args.values;

	// These commands can run directly without parsing the user config.
	switch (cmd) {
		case 'help':
			await printAstroHelp();
			return;
		case 'version':
			printVersion();
			return;
		case 'info': {
			const { printInfo } = await import('./info/index.js');
			await printInfo({ flags });
			return;
		}
		case 'docs': {
			const { docs } = await import('./docs/index.js');
			await docs({ flags });
			return;
		}
		case 'telemetry': {
			// Do not track session start, since the user may be trying to enable,
			// disable, or modify telemetry settings.
			const { update } = await import('./telemetry/index.js');
			const subcommand = args.positionals[3];
			await update(subcommand, { flags });
			return;
		}
		case 'sync': {
			const { sync } = await import('./sync/index.js');
			const exitCode = await sync({ flags });
			return process.exit(exitCode);
		}
		case 'preferences': {
			const { preferences } = await import('./preferences/index.js');
			const [subcommand, key, value] = args.positionals.slice(3);
			const exitCode = await preferences(subcommand, key, value, { flags });
			return process.exit(exitCode);
		}
	}

	// In verbose/debug mode, we log the debug logs asap before any potential errors could appear
	if (flags.verbose) {
		const { enableVerboseLogging } = await import('../core/logger/node.js');
		enableVerboseLogging();
	}

	const { notify } = await import('./telemetry/index.js');
	await notify();

	// These commands uses the logging and user config. All commands are assumed to have been handled
	// by the end of this switch statement.
	switch (cmd) {
		case 'add': {
			const { add } = await import('./add/index.js');
			const packages = args.positionals.slice(3);
			await add(packages, { flags });
			return;
		}
		case 'db':
		case 'login':
		case 'logout':
		case 'link':
		case 'init': {
			const { db } = await import('./db/index.js');
			await db({ positionals: args.positionals, flags });
			return;
		}
		case 'dev': {
			const { dev } = await import('./dev/index.js');
			const server = await dev({ flags });
			if (server) {
				return await new Promise(() => {}); // lives forever
			}
			return;
		}
		case 'build': {
			const { build } = await import('./build/index.js');
			await build({ flags });
			return;
		}
		case 'preview': {
			const { preview } = await import('./preview/index.js');
			const server = await preview({ flags });
			if (server) {
				return await server.closed(); // keep alive until the server is closed
			}
			return;
		}
		case 'check': {
			const { check } = await import('./check/index.js');
			const checkServer = await check(flags);
			if (flags.watch) {
				return await new Promise(() => {}); // lives forever
			} else {
				return process.exit(checkServer ? 1 : 0);
			}
		}
	}

	// No command handler matched! This is unexpected.
	throw new Error(`Error running ${cmd} -- no command found.`);
}

/** The primary CLI action */
export async function cli(argv: string[]) {
	const args = parseArgs({
		args: argv,
		allowPositionals: true,
		strict: false,
		options: {
			global: { type: 'boolean', short: 'g' },
			host: { type: 'string' }, // Can be boolean too, which is covered by `strict: false`
			open: { type: 'string' }, // Can be boolean too, which is covered by `strict: false`
			// TODO: Add more flags here
		},
	});
	const cmd = resolveCommand(args);
	try {
		await runCommand(cmd, args);
	} catch (err) {
		const { throwAndExit } = await import('./throw-and-exit.js');
		await throwAndExit(cmd, err);
	}
}
