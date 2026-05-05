import { isAgent } from 'am-i-vibing';
import colors from 'piccolore';
import devServer from '../../core/dev/index.js';
import { printHelp } from '../../core/messages/runtime.js';
import { type Flags, flagsToAstroInlineConfig } from '../flags.js';

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
			usage: '[...flags]',
			tables: {
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
					[
						'--experimental-background',
						'Start the dev server as a background process.',
					],
					['--experimental-stop', 'Stop a running background dev server.'],
					['--experimental-status', 'Check if a dev server is running.'],
					['--experimental-logs', 'View logs from a background dev server.'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Check ${colors.cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-dev',
			)} for more information.`,
		});
		return;
	}

	// Handle --experimental-stop: stop a running dev server
	if (flags.experimentalStop) {
		const { stop } = await import('./stop.js');
		await stop({ flags });
		return;
	}

	// Handle --experimental-status: check if a dev server is running
	if (flags.experimentalStatus) {
		const { status } = await import('./status.js');
		await status({ flags });
		return;
	}

	// Handle --experimental-logs: view logs from a background dev server
	if (flags.experimentalLogs) {
		const { logs } = await import('./logs.js');
		await logs({ flags });
		return;
	}

	// Handle --experimental-background: start as a background process.
	// Also auto-enable when an AI coding agent is detected.
	if (flags.experimentalBackground || isRunByAgent()) {
		const { background } = await import('./background.js');
		await background({ flags });
		return;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);

	return await devServer(inlineConfig);
}
