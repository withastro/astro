import colors from 'piccolore';
import { pathToFileURL } from 'node:url';
import { checkExistingServer, removeLockFile, writeLockFile } from '../../core/dev/lockfile.js';
import { resolveRoot } from '../../core/config/config.js';
import { printHelp } from '../../core/messages/runtime.js';
import previewServer from '../../core/preview/index.js';
import { isRunByAgent } from '../agent.js';
import { isIgnoreLock } from '../dev/index.js';
import { type Flags, createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';
import { background, logs, previewServerCommand, status, stop } from '../server.js';

interface PreviewOptions {
	flags: Flags;
}

export async function preview({ flags }: PreviewOptions) {
	if (flags?.help || flags?.h) {
		printHelp({
			commandName: 'astro preview',
			usage: '[command] [...flags]',
			tables: {
				Commands: [
					['stop', 'Stop a running background preview server.'],
					['status', 'Check if a preview server is running.'],
					['logs [--follow]', 'View logs from a background preview server.'],
				],
				Flags: [
					['--background', 'Start the preview server as a background process.'],
					['--port', `Specify which port to run on. Defaults to 4321.`],
					['--host', `Listen on all addresses, including LAN and public addresses.`],
					['--host <custom-address>', `Expose on a network IP address at <custom-address>`],
					['--open', 'Automatically open the app in the browser on server start'],
					[
						'--ignore-lock',
						'Start the preview server even if another one is already running, without checking or writing the lock file.',
					],
					[
						'--allowed-hosts',
						'Specify a comma-separated list of allowed hosts or allow any hostname.',
					],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Starts a local server to serve your static dist/ directory. Check ${colors.cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-preview',
			)} for more information.`,
		});
		return;
	}

	const agentDetected = !process.env.ASTRO_PREVIEW_BACKGROUND && isRunByAgent();
	if (agentDetected) {
		flags.json = true;
	}

	const ignoreLock = isIgnoreLock(flags);
	const wantsBackground = !!flags.background || agentDetected;

	const logger = createLoggerFromFlags(flags);
	const subcommand = flags._[3]?.toString();

	if (subcommand === 'stop') {
		await stop({ flags, logger, config: previewServerCommand });
		return;
	}

	if (subcommand === 'status') {
		await status({ flags, logger, config: previewServerCommand });
		return;
	}

	if (subcommand === 'logs') {
		await logs({ flags, logger, config: previewServerCommand });
		return;
	}

	// Reject conflicting flag combinations up front, before starting anything.
	if (ignoreLock) {
		if (flags.force) {
			throw new Error(
				[
					'`--force` and `--ignore-lock` cannot be used together.',
					'',
					'`--force` replaces the existing preview server; `--ignore-lock` starts a new one alongside it without touching the lock file. Choose one.',
				].join('\n'),
			);
		}
	}

	if (ignoreLock && wantsBackground) {
		const reason = flags.background
			? '`--background`'
			: 'an auto-detected AI agent environment, which runs the preview server in the background automatically';
		throw new Error(
			[
				`\`--ignore-lock\` cannot be used together with ${reason}.`,
				'',
				'Background preview servers rely on the lock file so `astro preview stop`, `astro preview status`, and `astro preview logs` can find them.',
				'Run the preview server in the foreground to use --ignore-lock.',
			].join('\n'),
		);
	}

	if (wantsBackground) {
		await background({ flags, logger, config: previewServerCommand });
		return;
	}

	if (subcommand) {
		logger.error(
			'SKIP_FORMAT',
			`Unknown command: astro preview ${subcommand}\n\nRun \`astro preview --help\` to see available commands.`,
		);
		process.exit(1);
	}

	const root = pathToFileURL(resolveRoot(flags.root) + '/');

	// `--ignore-lock` opts this instance out of the lock file entirely: it doesn't block on
	// an existing server, and it won't be tracked by `astro preview stop`/`status`/`logs`.
	if (ignoreLock) {
		const existingServer = await checkExistingServer(root, 'preview');
		if (existingServer) {
			logger.info(
				'SKIP_FORMAT',
				[
					`Starting a new preview server alongside the one already running at ${existingServer.url} (pid ${existingServer.pid}).`,
					'This instance is not tracked by `astro preview stop`, `astro preview status`, or `astro preview logs`.',
				].join('\n'),
			);
		}
		const inlineConfig = flagsToAstroInlineConfig(flags);
		return await previewServer(inlineConfig);
	}

	const existingServer = await checkExistingServer(root, 'preview');
	if (existingServer) {
		const message = [
			'Another astro preview server is already running.',
			'',
			`  URL:  ${existingServer.url}`,
			`  PID:  ${existingServer.pid}`,
			'',
			`Run \`astro preview stop\` to stop it, or use \`astro preview --force\` to replace it.`,
		].join('\n');
		throw new Error(message);
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);
	const server = await previewServer(inlineConfig);
	const serverUrl = server.urls?.local[0]
		? new URL(server.urls.local[0]).origin
		: `http://${server.host ?? 'localhost'}:${server.port}`;

	writeLockFile(
		root,
		{
			pid: process.pid,
			port: server.port,
			url: serverUrl,
			urls: server.urls,
			background: !!process.env.ASTRO_PREVIEW_BACKGROUND,
			startedAt: new Date().toISOString(),
		},
		'preview',
	);

	const originalStop = server.stop.bind(server);
	server.stop = async () => {
		removeLockFile(root, 'preview');
		await originalStop();
	};

	return server;
}
