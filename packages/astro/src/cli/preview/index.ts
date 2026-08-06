import colors from 'piccolore';
import { pathToFileURL } from 'node:url';
import { checkExistingServer, removeLockFile, writeLockFile } from '../../core/dev/lockfile.js';
import { resolveRoot } from '../../core/config/config.js';
import { printHelp } from '../../core/messages/runtime.js';
import previewServer from '../../core/preview/index.js';
import { isRunByAgent } from '../agent.js';
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

	if (flags.background || agentDetected) {
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
	const existingServer = checkExistingServer(root, 'preview');
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
