import type http from 'http';
import { cyan } from 'kleur/colors';
import type { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import type * as vite from 'vite';
import type yargs from 'yargs-parser';
import type { AstroSettings } from '../../@types/astro';
import { attachContentServerListeners } from '../../content/index.js';
import { telemetry } from '../../events/index.js';
import { info, warn, type LogOptions } from '../logger/core.js';
import * as msg from '../messages.js';
import { printHelp } from '../messages.js';
import { startContainer } from './container.js';
import { createContainerWithAutomaticRestart } from './restart.js';

export interface DevOptions {
	configFlag: string | undefined;
	configFlagPath: string | undefined;
	flags?: yargs.Arguments;
	logging: LogOptions;
	handleConfigError: (error: Error) => void;
	isRestart?: boolean;
}

export interface DevServer {
	address: AddressInfo;
	handle: (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => void;
	watcher: vite.FSWatcher;
	stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(
	settings: AstroSettings,
	options: DevOptions
): Promise<DevServer | undefined> {
	if (options.flags?.help || options.flags?.h) {
		printHelp({
			commandName: 'astro dev',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--port', `Specify which port to run on. Defaults to 3000.`],
					['--host', `Listen on all addresses, including LAN and public addresses.`],
					['--host <custom-address>', `Expose on a network IP address at <custom-address>`],
					['--open', 'Automatically open the app in the browser on server start'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Check ${cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-dev'
			)} for more information.`,
		});
		return;
	}

	const devStart = performance.now();
	await telemetry.record([]);

	// Create a container which sets up the Vite server.
	const restart = await createContainerWithAutomaticRestart({
		flags: options.flags ?? {},
		handleConfigError: options.handleConfigError,
		// eslint-disable-next-line no-console
		beforeRestart: () => console.clear(),
		params: {
			settings,
			root: options.flags?.root,
			logging: options.logging,
			isRestart: options.isRestart,
		},
	});

	// Start listening to the port
	const devServerAddressInfo = await startContainer(restart.container);

	info(
		options.logging,
		null,
		msg.serverStart({
			startupTime: performance.now() - devStart,
			resolvedUrls: restart.container.viteServer.resolvedUrls || { local: [], network: [] },
			host: settings.config.server.host,
			base: settings.config.base,
			isRestart: options.isRestart,
		})
	);

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(options.logging, null, msg.prerelease({ currentVersion }));
	}
	if (restart.container.viteConfig.server?.fs?.strict === false) {
		warn(options.logging, null, msg.fsStrictWarning());
	}

	await attachContentServerListeners(restart.container);

	return {
		address: devServerAddressInfo,
		get watcher() {
			return restart.container.viteServer.watcher;
		},
		handle(req, res) {
			return restart.container.handle(req, res);
		},
		async stop() {
			await restart.container.close();
		},
	};
}
