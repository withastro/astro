import fs from 'node:fs';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { bold, green } from 'kleur/colors';
import { performance } from 'perf_hooks';
import type * as vite from 'vite';
import type { AstroInlineConfig } from '../../@types/astro.js';
import { attachContentServerListeners } from '../../content/index.js';
import { telemetry } from '../../events/index.js';
import * as msg from '../messages.js';
import { ensureProcessNodeEnv } from '../util.js';
import { startContainer } from './container.js';
import { createContainerWithAutomaticRestart } from './restart.js';
import { execa } from 'execa';
import { gt } from 'semver';

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

	if (!isPrerelease && restart.container.settings.config.checkUpdates) {
		try {
			let versionToCheck = 'latest'

			if (restart.container.settings.config.checkUpdates === 'semver') {
				const packageJson = JSON.parse(fs.readFileSync(new URL('package.json', restart.container.settings.config.root), 'utf-8'));
				const currentAstroSpecifier = packageJson.dependencies?.astro ?? packageJson.devDependencies?.astro;

				if (currentAstroSpecifier) {
					versionToCheck = currentAstroSpecifier;
				}
			}

			// Don't await this, we don't want to block the dev server from starting
			execa('npm', ['view', `astro@${versionToCheck}`, 'version', '--json']).then((result) => {
				let latestVersion = JSON.parse(result.stdout);

				if (Array.isArray(latestVersion)) {
					// If the version returned is an array, it means we requested a semver range and the latest version is the last element
					latestVersion = latestVersion.pop();
				}

				if (gt(latestVersion, currentVersion)) {
					logger.info('update', `A new version of Astro is available! Run ${green('npx @astrojs/upgrade')} to update to ${bold(latestVersion)}!`);

					// Only update the latestAstroVersion if the latest version is greater than the current version, that way we don't need to check again
					restart.container.settings.latestAstroVersion = latestVersion;
				}
			}).catch(() => {
				// Just do nothing if this fails, it's okay.
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
