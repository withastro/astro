import yargs from 'yargs-parser';

type CLICommand =
	| 'help'
	| 'version'
	| 'add'
	| 'create-key'
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

/** Determine which command the user requested */
function resolveCommand(flags: yargs.Arguments): CLICommand {
	const cmd = flags._[2] as string;
	if (flags.version) return 'version';

	const supportedCommands = new Set([
		'add',
		'sync',
		'telemetry',
		'preferences',
		'dev',
		'build',
		'preview',
		'check',
		'create-key',
		'docs',
		'db',
		'info',
		'login',
		'logout',
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
async function runCommand(cmd: string, flags: yargs.Arguments) {
	const [
		{ createLoggerFromFlags },
		{ createPicocolorsTextStyler },
		{ createBuildTimeAstroVersionProvider },
		{ createLoggerHelpDisplay },
		{ createCliCommandRunner },
	] = await Promise.all([
		import('./flags.js'),
		import('./infra/picocolors-text-styler.js'),
		import('./infra/build-time-astro-version-provider.js'),
		import('./infra/logger-help-display.js'),
		import('./infra/cli-command-runner.js'),
	]);
	const logger = createLoggerFromFlags(flags);
	const textStyler = createPicocolorsTextStyler();
	const astroVersionProvider = createBuildTimeAstroVersionProvider();
	const helpDisplay = createLoggerHelpDisplay({
		logger,
		flags,
		textStyler,
		astroVersionProvider,
	});
	const runner = createCliCommandRunner({ helpDisplay });

	// These commands can run directly without parsing the user config.
	switch (cmd) {
		/** Display --help flag */
		case 'help': {
			const { DEFAULT_HELP_PAYLOAD } = await import('./help/index.js');
			helpDisplay.show(DEFAULT_HELP_PAYLOAD);
			return;
		}
		/** Display --version flag */
		case 'version': {
			const { formatVersion } = await import('./utils/format-version.js');
			logger.info(
				'SKIP_FORMAT',
				formatVersion({ name: 'astro', textStyler, astroVersionProvider }),
			);
			return;
		}
		case 'info': {
			const { printInfo } = await import('./info/index.js');
			await printInfo({ flags });
			return;
		}
		case 'create-key': {
			const [{ createCryptoKeyGenerator }, { createKeyCommand }] = await Promise.all([
				import('./create-key/infra/crypto-key-generator.js'),
				import('./create-key/core/create-key.js'),
			]);

			const keyGenerator = createCryptoKeyGenerator();
			return await runner.run(createKeyCommand, { logger, keyGenerator });
		}
		case 'docs': {
			const [
				{ createTinyexecCommandExecutor },
				{ createProcessPlatformProvider },
				{ openDocsCommand },
			] = await Promise.all([
				import('./docs/infra/tinyexec-command-executor.js'),
				import('./docs/infra/process-platform-provider.js'),
				import('./docs/core/open-docs.js'),
			]);
			const commandExecutor = createTinyexecCommandExecutor();
			const platformProvider = createProcessPlatformProvider();

			return await runner.run(openDocsCommand, {
				url: 'https://docs.astro.build/',
				logger,
				commandExecutor,
				platformProvider,
			});
		}
		case 'telemetry': {
			// Do not track session start, since the user may be trying to enable,
			// disable, or modify telemetry settings.
			const { update } = await import('./telemetry/index.js');
			const subcommand = flags._[3]?.toString();
			await update(subcommand, { flags });
			return;
		}
		case 'sync': {
			const { sync } = await import('./sync/index.js');
			await sync({ flags });
			return;
		}
		case 'preferences': {
			const { preferences } = await import('./preferences/index.js');
			const [subcommand, key, value] = flags._.slice(3).map((v) => v.toString());
			const exitCode = await preferences(subcommand, key, value, { flags });
			return process.exit(exitCode);
		}
	}

	if (flags.verbose) {
		// In verbose/debug mode, we log the debug logs asap before any potential errors could appear
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
			const packages = flags._.slice(3) as string[];
			await add(packages, { flags });
			return;
		}
		case 'db':
		case 'login':
		case 'logout':
		case 'link':
		case 'init': {
			const { db } = await import('./db/index.js');
			await db({ flags });
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
	const flags = yargs(argv, { boolean: ['global'], alias: { g: 'global' } });
	const cmd = resolveCommand(flags);
	try {
		await runCommand(cmd, flags);
	} catch (err) {
		const { throwAndExit } = await import('./throw-and-exit.js');
		await throwAndExit(cmd, err);
	}
}
