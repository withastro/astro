import fs from 'node:fs';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { green } from 'kleur/colors';
import { performance } from 'perf_hooks';
import { gte } from 'semver';
import type * as vite from 'vite';
import type { AstroInlineConfig } from '../../@types/astro.js';
import { attachContentServerListeners } from '../../content/index.js';
import { telemetry } from '../../events/index.js';
import * as msg from '../messages.js';
import { ensureProcessNodeEnv } from '../util.js';
import { startContainer } from './container.js';
import { createContainerWithAutomaticRestart } from './restart.js';
import { fetchLatestAstroVersion, shouldCheckForUpdates } from './update-check.js';

export interface DevServer {
	address: AddressInfo;
	handle: (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => void;
	watcher: vite.FSWatcher;
	stop(): Promise<void>;
}

/**
 * Runs Astro’s development server. This is a local HTTP server that doesn’t bundle assets.
 * It uses Hot Module Replacement (HMR) to update your browser as you save changes in your editor.
 *
 * @experimental The JavaScript API is experimental
 */
export default async function dev(inlineConfig: AstroInlineConfig): Promise<DevServer> {
	ensureProcessNodeEnv('development');
	const devStart = performance.now();
	await telemetry.record([]);

	// Create a container which sets up the Vite server.
	const restart = await createContainerWithAutomaticRestart({ inlineConfig, fs });
	const logger = restart.container.logger;

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	const isPrerelease = currentVersion.includes('-');
	if (!isPrerelease && (await shouldCheckForUpdates(restart.container.settings.preferences))) {
		try {
			const t0 = performance.now();
			fetchLatestAstroVersion().then((version) => {
				const t1 = performance.now();
				console.log(`Fetching latest Astro version took ${t1 - t0} milliseconds.`);
				// Only update the latestAstroVersion if the latest version is greater than the current version, that way we don't need to check it again
				if (gte(version, currentVersion)) {
					restart.container.settings.latestAstroVersion = version;
				}
			});
		} catch (_) {
			// Just do nothing if this fails, once again, it's okay.
		}
	}

	// Start listening to the port
	const devServerAddressInfo = await startContainer(restart.container);
	logger.info(
		'SKIP_FORMAT',
		msg.serverStart({
			startupTime: performance.now() - devStart,
			resolvedUrls: restart.container.viteServer.resolvedUrls || { local: [], network: [] },
			host: restart.container.settings.config.server.host,
			base: restart.container.settings.config.base,
		})
	);

	if (isPrerelease) {
		logger.warn('SKIP_FORMAT', msg.prerelease({ currentVersion }));
	}
	if (restart.container.viteServer.config.server?.fs?.strict === false) {
		logger.warn('SKIP_FORMAT', msg.fsStrictWarning());
	}

	if (restart.container.settings.latestAstroVersion) {
		logger.warn(
			'SKIP_FORMAT',
			msg.newVersionAvailable({ latestVersion: restart.container.settings.latestAstroVersion })
		);
	}

	await attachContentServerListeners(restart.container);

	logger.info(null, green('watching for file changes...'));

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
