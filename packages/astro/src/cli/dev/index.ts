import { detectAgenticEnvironment } from 'am-i-vibing';
import colors from 'piccolore';
import devServer from '../../core/dev/index.js';
import { pathToFileURL } from 'node:url';
import {
	checkExistingServer,
	killDevServer,
	removeLockFile,
	writeLockFile,
} from '../../core/dev/lockfile.js';
import { resolveRoot } from '../../core/config/config.js';
import { printHelp } from '../../core/messages/runtime.js';
import { type Flags, createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';

interface DevOptions {
	flags: Flags;
}

function isRunByAgent(): boolean {
	try {
		// Only treat direct "agent" types as auto-background-worthy.
		// "hybrid" environments (e.g. Warp terminal) may not actually be running
		// an AI agent, so we avoid false positives by excluding them.
		return detectAgenticEnvironment().type === 'agent';
	} catch {
		return false;
	}
}

/**
 * `yargs-parser` camel-cases `--ignore-lock` to `flags.ignoreLock`.
 */
export function isIgnoreLock(flags: Flags): boolean {
	return flags.ignoreLock === true;
}

/**
 * `--ignore-lock` skips the lock file entirely, so a background dev server started with it
 * could never be found by `astro dev stop`/`status`/`logs`. Returns an error message if
 * background mode (explicit `--background`, or implied by AI agent detection) is combined
 * with `--ignore-lock`, or `null` if there's no conflict.
 */
export function getBackgroundIgnoreLockConflict(
	flags: Flags,
	wantsBackground: boolean,
): string | null {
	if (!wantsBackground) {
		return null;
	}
	const reason = flags.background
		? '`--background`'
		: 'an auto-detected AI agent environment, which runs the dev server in the background automatically';
	return [
		`\`--ignore-lock\` cannot be used together with ${reason}.`,
		'',
		'Background dev servers rely on the lock file so `astro dev stop`, `astro dev status`, and `astro dev logs` can find them.',
		'Run the dev server in the foreground to use --ignore-lock.',
	].join('\n');
}

/**
 * `--force` (replace the existing server) and `--ignore-lock` (start alongside it,
 * untracked) express contradictory intent. Returns an error message if both are set,
 * or `null` otherwise.
 */
export function getForceIgnoreLockConflict(flags: Flags): string | null {
	if (!flags.force) {
		return null;
	}
	return [
		'`--force` and `--ignore-lock` cannot be used together.',
		'',
		'`--force` replaces the existing dev server; `--ignore-lock` starts a new one alongside it without touching the lock file. Choose one.',
	].join('\n');
}

export async function dev({ flags }: DevOptions) {
	if (flags.help || flags.h) {
		printHelp({
			commandName: 'astro dev',
			usage: '[command] [...flags]',
			tables: {
				Commands: [
					['stop', 'Stop a running background dev server.'],
					['status', 'Check if a dev server is running.'],
					['logs [--follow]', 'View logs from a background dev server.'],
				],
				Flags: [
					['--background', 'Start the dev server as a background process.'],
					['--mode', `Specify the mode of the project. Defaults to "development".`],
					['--port', `Specify which port to run on. Defaults to 4321.`],
					['--host', `Listen on all addresses, including LAN and public addresses.`],
					['--host <custom-address>', `Expose on a network IP address at <custom-address>`],
					['--open', 'Automatically open the app in the browser on server start'],
					['--force', 'Clear the content layer cache, forcing a full rebuild.'],
					[
						'--ignore-lock',
						'Start the dev server even if another one is already running, without checking or writing the lock file.',
					],
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
		flags.json = true;
	}

	const ignoreLock = isIgnoreLock(flags);
	const wantsBackground = !!flags.background || agentDetected;

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

	// Reject conflicting flag combinations up front, before starting anything.
	if (ignoreLock) {
		const conflict =
			getBackgroundIgnoreLockConflict(flags, wantsBackground) ?? getForceIgnoreLockConflict(flags);
		if (conflict) {
			throw new Error(conflict);
		}
	}

	// Handle `astro dev --background` or auto-enable when an AI coding agent is detected.
	// Skip if ASTRO_DEV_BACKGROUND is set — this means we're the spawned child process
	// and should run the foreground dev server, not recurse into background mode.
	if (wantsBackground) {
		const { background } = await import('./background.js');
		await background({ flags, logger });
		return;
	}

	// Unknown subcommand — exit with an error before starting the server.
	if (subcommand) {
		logger.error(
			'SKIP_FORMAT',
			`Unknown command: astro dev ${subcommand}\n\nRun \`astro dev --help\` to see available commands.`,
		);
		process.exit(1);
	}

	// Foreground dev server: check lock file, start server, write lock file
	const root = pathToFileURL(resolveRoot(flags.root) + '/');

	// `--ignore-lock` opts this instance out of the lock file entirely: it doesn't block on
	// an existing server, and it won't be tracked by `astro dev stop`/`status`/`logs`.
	// We still do a read-only check purely to give the user a heads-up.
	if (ignoreLock) {
		const existingServer = checkExistingServer(root);
		if (existingServer) {
			logger.info(
				'SKIP_FORMAT',
				[
					`Starting a new dev server alongside the one already running at ${existingServer.url} (pid ${existingServer.pid}).`,
					'This instance is not tracked by `astro dev stop`, `astro dev status`, or `astro dev logs`.',
				].join('\n'),
			);
		}
		const inlineConfig = flagsToAstroInlineConfig(flags);
		return await devServer(inlineConfig);
	}

	const existingServer = checkExistingServer(root);
	if (existingServer) {
		if (flags.force) {
			// --force: kill the existing server and replace it
			await killDevServer(root, existingServer);
		} else {
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
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);
	const server = await devServer(inlineConfig);

	// Use Vite's resolved local URL which accounts for host and protocol (http/https).
	const serverUrl = new URL(server.resolvedUrls.local[0]).origin;
	writeLockFile(root, {
		pid: process.pid,
		port: server.address.port,
		url: serverUrl,
		urls: server.resolvedUrls,
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
