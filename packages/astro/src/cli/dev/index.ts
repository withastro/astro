import { isAgent } from 'am-i-vibing';
import colors from 'piccolore';
import devServer from '../../core/dev/index.js';
import { checkExistingServer, removeLockFile, resolveRootURL, writeLockFile } from '../../core/dev/lockfile.js';
import { printHelp } from '../../core/messages/runtime.js';
import { type Flags, createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';

interface DevOptions {
	flags: Flags;
}

function isRunByAgent(): boolean {
	try {
		return isAgent();
	} catch {
		return false;
	}
}

export async function dev({ flags }: DevOptions) {
	if (flags.help || flags.h) {
		printHelp({
			commandName: 'astro dev',
			usage: '[command] [...flags]',
			tables: {
				Commands: [
					['background', 'Start the dev server as a background process.'],
					['stop', 'Stop a running background dev server.'],
					['status', 'Check if a dev server is running.'],
					['logs [--follow]', 'View logs from a background dev server.'],
				],
				Flags: [
					['--mode', `Specify the mode of the project. Defaults to "development".`],
					['--port', `Specify which port to run on. Defaults to 4321.`],
					['--host', `Listen on all addresses, including LAN and public addresses.`],
					['--host <custom-address>', `Expose on a network IP address at <custom-address>`],
					['--open', 'Automatically open the app in the browser on server start'],
					['--force', 'Clear the content layer cache, forcing a full rebuild.'],
					[
						'--allowed-hosts',
						'Specify a comma-separated list of allowed hosts or allow any hostname.',
					],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Check ${colors.cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-dev',
			)} for more information.`,
		});
		return;
	}

	// When an AI coding agent is detected, enable background mode and JSON logging automatically.
	const agentDetected = !process.env.ASTRO_DEV_BACKGROUND && isRunByAgent();
	if (agentDetected) {
		flags.experimentalJson = true;
	}

	const logger = createLoggerFromFlags(flags);
	const subcommand = flags._[3]?.toString();

	// Handle `astro dev stop`
	if (subcommand === 'stop') {
		const { stop } = await import('./stop.js');
		await stop({ flags, logger });
		return;
	}

	// Handle `astro dev status`
	if (subcommand === 'status') {
		const { status } = await import('./status.js');
		await status({ flags, logger });
		return;
	}

	// Handle `astro dev logs`
	if (subcommand === 'logs') {
		const { logs } = await import('./logs.js');
		await logs({ flags, logger });
		return;
	}

	// Handle `astro dev background` or auto-enable when an AI coding agent is detected.
	// Skip if ASTRO_DEV_BACKGROUND is set — this means we're the spawned child process
	// and should run the foreground dev server, not recurse into background mode.
	if (subcommand === 'background' || agentDetected) {
		const { background } = await import('./background.js');
		await background({ flags, logger });
		return;
	}

	// Foreground dev server: check lock file, start server, write lock file
	const root = resolveRootURL(flags.root);
	const existingServer = checkExistingServer(root);
	if (existingServer) {
		const message = [
			'Another astro dev server is already running.',
			'',
			`  URL:  ${existingServer.url}`,
			`  PID:  ${existingServer.pid}`,
			'',
			`Run \`astro dev stop\` to stop it, or use \`astro dev --force\` to replace it.`,
		].join('\n');
		throw new Error(message);
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);
	const server = await devServer(inlineConfig);

	// Use Vite's resolved local URL which accounts for host and protocol (http/https).
	const serverUrl = new URL(server.resolvedUrls.local[0]).origin;
	writeLockFile(root, {
		pid: process.pid,
		port: server.address.port,
		url: serverUrl,
		background: !!process.env.ASTRO_DEV_BACKGROUND,
		startedAt: new Date().toISOString(),
	});

	// Wrap the original stop to also clean up the lock file
	const originalStop = server.stop.bind(server);
	server.stop = async () => {
		removeLockFile(root);
		await originalStop();
	};

	return server;
}
