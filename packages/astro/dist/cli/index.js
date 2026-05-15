import yargs from 'yargs-parser';
function resolveCommand(flags) {
	const cmd = flags._[2];
	if (flags.version) return 'version';
	const supportedCommands = /* @__PURE__ */ new Set([
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
		return cmd;
	}
	return 'help';
}
async function runCommand(cmd, flags) {
	const [
		{ createLoggerFromFlags },
		{ piccoloreTextStyler: textStyler },
		{ BuildTimeAstroVersionProvider },
		{ LoggerHelpDisplay },
		{ CliCommandRunner },
	] = await Promise.all([
		import('./flags.js'),
		import('./infra/piccolore-text-styler.js'),
		import('./infra/build-time-astro-version-provider.js'),
		import('./infra/logger-help-display.js'),
		import('./infra/cli-command-runner.js'),
	]);
	const logger = createLoggerFromFlags(flags);
	const astroVersionProvider = new BuildTimeAstroVersionProvider();
	const helpDisplay = new LoggerHelpDisplay({
		logger,
		flags,
		textStyler,
		astroVersionProvider,
	});
	const runner = new CliCommandRunner({ helpDisplay });
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
			const [
				{ ProcessOperatingSystemProvider },
				{ CliAstroConfigResolver },
				{ ProcessPackageManagerUserAgentProvider },
				{ ProcessNodeVersionProvider },
				{ CliDebugInfoProvider },
				{ TinyexecCommandExecutor },
				{ getPackageManager },
				{ StyledDebugInfoFormatter },
				{ ClackPrompt },
				{ TinyclipClipboard },
				{ PassthroughTextStyler },
				{ infoCommand },
			] = await Promise.all([
				import('./infra/process-operating-system-provider.js'),
				import('./info/infra/cli-astro-config-resolver.js'),
				import('./info/infra/process-package-manager-user-agent-provider.js'),
				import('./info/infra/process-node-version-provider.js'),
				import('./info/infra/cli-debug-info-provider.js'),
				import('./infra/tinyexec-command-executor.js'),
				import('./info/core/get-package-manager.js'),
				import('./info/infra/styled-debug-info-formatter.js'),
				import('./info/infra/clack-prompt.js'),
				import('./info/infra/tinyclip-clipboard.js'),
				import('./infra/passthrough-text-styler.js'),
				import('./info/core/info.js'),
			]);
			const operatingSystemProvider = new ProcessOperatingSystemProvider();
			const astroConfigResolver = new CliAstroConfigResolver({ flags });
			const commandExecutor = new TinyexecCommandExecutor();
			const packageManagerUserAgentProvider = new ProcessPackageManagerUserAgentProvider();
			const nodeVersionProvider = new ProcessNodeVersionProvider();
			const debugInfoProvider = new CliDebugInfoProvider({
				config: await astroConfigResolver.resolve(),
				astroVersionProvider,
				operatingSystemProvider,
				packageManager: await getPackageManager({
					packageManagerUserAgentProvider,
					commandExecutor,
				}),
				nodeVersionProvider,
			});
			const prompt = new ClackPrompt({ force: flags.copy });
			const clipboard = new TinyclipClipboard({
				logger,
				prompt,
			});
			return await runner.run(infoCommand, {
				logger,
				debugInfoProvider,
				getDebugInfoFormatter: ({ pretty }) =>
					new StyledDebugInfoFormatter({
						textStyler: pretty ? textStyler : new PassthroughTextStyler(),
					}),
				clipboard,
			});
		}
		case 'create-key': {
			const [{ CryptoKeyGenerator }, { createKeyCommand }] = await Promise.all([
				import('./create-key/infra/crypto-key-generator.js'),
				import('./create-key/core/create-key.js'),
			]);
			const keyGenerator = new CryptoKeyGenerator();
			return await runner.run(createKeyCommand, { logger, keyGenerator });
		}
		case 'docs': {
			const [
				{ TinyexecCommandExecutor },
				{ ProcessOperatingSystemProvider },
				{ ProcessCloudIdeProvider },
				{ openDocsCommand },
			] = await Promise.all([
				import('./infra/tinyexec-command-executor.js'),
				import('./infra/process-operating-system-provider.js'),
				import('./docs/infra/process-cloud-ide-provider.js'),
				import('./docs/core/open-docs.js'),
			]);
			const commandExecutor = new TinyexecCommandExecutor();
			const operatingSystemProvider = new ProcessOperatingSystemProvider();
			const cloudIdeProvider = new ProcessCloudIdeProvider();
			return await runner.run(openDocsCommand, {
				url: 'https://docs.astro.build/',
				logger,
				commandExecutor,
				operatingSystemProvider,
				cloudIdeProvider,
			});
		}
		case 'telemetry': {
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
		const { enableVerboseLogging } = await import('../core/logger/node.js');
		enableVerboseLogging();
	}
	const { notify } = await import('./telemetry/index.js');
	await notify();
	switch (cmd) {
		case 'add': {
			const { add } = await import('./add/index.js');
			const packages = flags._.slice(3);
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
				return await new Promise(() => {});
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
				return await server.closed();
			}
			return;
		}
		case 'check': {
			const { check } = await import('./check/index.js');
			const checkServer = await check(flags);
			if (flags.watch) {
				return await new Promise(() => {});
			} else {
				return process.exit(typeof checkServer === 'boolean' && checkServer ? 1 : 0);
			}
		}
	}
	throw new Error(`Error running ${cmd} -- no command found.`);
}
async function cli(argv) {
	const flags = yargs(argv, { boolean: ['global'], alias: { g: 'global' } });
	const cmd = resolveCommand(flags);
	try {
		await runCommand(cmd, flags);
	} catch (err) {
		const { throwAndExit } = await import('./throw-and-exit.js');
		await throwAndExit(cmd, err);
	}
}
export { cli };
