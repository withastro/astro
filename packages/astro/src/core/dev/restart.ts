import type nodeFs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as vite from 'vite';
import { globalContentLayer } from '../../content/instance.js';
import { attachContentServerListeners } from '../../content/server-listeners.js';
import { eventCliSession, telemetry } from '../../events/index.js';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/hooks.js';
import { SETTINGS_FILE } from '../../preferences/constants.js';
import { getPrerenderDefault } from '../../prerender/utils.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroInlineConfig } from '../../types/public/config.js';
import { createSettings, resolveConfig } from '../config/index.js';
import { createVite } from '../create-vite.js';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import { isAstroConfigZodError } from '../errors/errors.js';
import { createSafeError } from '../errors/index.js';
import { createNodeLogger } from '../logger/node.js';
import { formatErrorMessage, warnIfCspWithShiki } from '../messages/runtime.js';
import { createRoutesList } from '../routing/create-manifest.js';
import type { Container } from './container.js';
import { createContainer } from './container.js';

const configRE = /.*astro.config.(?:mjs|mts|cjs|cts|js|ts)$/;

function shouldRestartContainer(
	{ settings, inlineConfig, restartInFlight }: Container,
	changedFile: string,
): boolean {
	if (restartInFlight) return false;

	let shouldRestart = false;
	const normalizedChangedFile = vite.normalizePath(changedFile);

	if (inlineConfig.configFile) {
		shouldRestart = vite.normalizePath(inlineConfig.configFile) === normalizedChangedFile;
	} else {
		shouldRestart = configRE.test(normalizedChangedFile);
		const settingsPath = vite.normalizePath(
			fileURLToPath(new URL(SETTINGS_FILE, settings.dotAstroDir)),
		);
		if (settingsPath.endsWith(normalizedChangedFile)) {
			shouldRestart = settings.preferences.ignoreNextPreferenceReload ? false : true;
			settings.preferences.ignoreNextPreferenceReload = false;
		}
	}

	if (!shouldRestart && settings.watchFiles.length > 0) {
		shouldRestart = settings.watchFiles.some(
			(path) => vite.normalizePath(path) === vite.normalizePath(changedFile),
		);
	}

	return shouldRestart;
}

/**
 * Restart the dev server in-place by reusing the existing Vite server instance.
 *
 * Instead of tearing down and recreating the entire container (which creates a
 * brand new Vite server), this function re-reads the Astro config, builds a new
 * Vite inline config with updated plugins, patches it onto the existing server,
 * then calls Vite's own native restart. Vite's restart does an in-place mutation
 * of the server object, keeping the same HTTP server / TCP socket alive and
 * passing `previousEnvironments` to plugins — allowing adapters like
 * `@cloudflare/vite-plugin` to reuse their miniflare instance rather than
 * disposing and recreating it.
 */
async function restartContainerInPlace(container: Container): Promise<AstroSettings | Error> {
	const { logger, settings: existingSettings, inlineConfig, fs } = container;
	container.restartInFlight = true;

	try {
		const { astroConfig } = await resolveConfig(inlineConfig, 'dev', fs);
		warnIfCspWithShiki(astroConfig, logger);
		let settings = await createSettings(
			astroConfig,
			inlineConfig.logLevel,
			fileURLToPath(existingSettings.config.root),
		);

		settings = await runHookConfigSetup({ settings, command: 'dev', logger, isRestart: true });
		if (!settings.adapter?.adapterFeatures?.buildOutput) {
			settings.buildOutput = getPrerenderDefault(settings.config) ? 'static' : 'server';
		}
		await runHookConfigDone({ settings, logger, command: 'dev' });

		const mode = inlineConfig?.mode ?? 'development';
		const {
			server: { host, headers, allowedHosts },
		} = settings.config;
		const rendererClientEntries = settings.renderers
			.map((r) => r.clientEntrypoint)
			.filter(Boolean) as string[];
		const routesList = await createRoutesList({ settings, fsMod: fs }, logger, { dev: true });
		const address = container.viteServer.httpServer?.address();
		const port = address !== null && typeof address === 'object' ? address.port : undefined;
		const newViteConfig = await createVite(
			{
				server: { host, headers, allowedHosts, port },
				optimizeDeps: { include: rendererClientEntries },
			},
			{ settings, logger, mode, command: 'dev', fs, sync: false, routesList },
		);

		// Resolve the new inline config into a full ResolvedConfig and assign it
		// onto the existing server so Vite's restartServer() uses the new plugins.
		container.viteServer.config = await vite.resolveConfig(newViteConfig, 'serve');

		await container.viteServer.restart();

		container.settings = settings;
		return settings;
	} catch (_err) {
		const error = createSafeError(_err);
		if (!isAstroConfigZodError(_err)) {
			logger.error(
				'config',
				formatErrorMessage(collectErrorMetadata(error), logger.level() === 'debug') + '\n',
			);
		}
		container.viteServer.environments?.client?.hot?.send({
			type: 'error',
			err: { message: error.message, stack: error.stack || '' },
		});
		logger.error(null, 'Continuing with previous valid configuration\n');
		return error;
	} finally {
		container.restartInFlight = false;
	}
}

interface CreateContainerWithAutomaticRestart {
	inlineConfig?: AstroInlineConfig;
	fs: typeof nodeFs;
}

interface Restart {
	container: Container;
	bindCLIShortcuts: () => void;
	restarted: () => Promise<Error | null>;
}

export async function createContainerWithAutomaticRestart({
	inlineConfig,
	fs,
}: CreateContainerWithAutomaticRestart): Promise<Restart> {
	const logger = createNodeLogger(inlineConfig ?? {});
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, 'dev', fs);
	warnIfCspWithShiki(astroConfig, logger);
	telemetry.record(eventCliSession('dev', userConfig));

	const settings = await createSettings(
		astroConfig,
		inlineConfig?.logLevel,
		fileURLToPath(astroConfig.root),
	);

	const initialContainer = await createContainer({
		settings,
		logger: logger,
		inlineConfig,
		fs,
	});

	let resolveRestart: (value: Error | null) => void;
	let restartComplete = new Promise<Error | null>((resolve) => {
		resolveRestart = resolve;
	});

	let restart: Restart = {
		container: initialContainer,
		bindCLIShortcuts() {
			const customShortcuts: Array<vite.CLIShortcut> = [
				{ key: 'r', description: '' },
				{ key: 'u', description: '' },
				{ key: 'c', description: '' },
			];

			customShortcuts.push({
				key: 's',
				description: 'sync content layer',
				action: () => {
					globalContentLayer.get()?.sync();
				},
			});
			restart.container.viteServer.bindCLIShortcuts({
				customShortcuts,
			});
		},
		restarted() {
			return restartComplete;
		},
	};

	function handleChangeRestart(logMsg: string) {
		return async function (changedFile: string) {
			if (shouldRestartContainer(restart.container, changedFile)) {
				logger.info(null, (logMsg + ' Restarting...').trim());
				const result = await restartContainerInPlace(restart.container);
				if (result instanceof Error) {
					resolveRestart(result);
				} else {
					setupContainer();
					await attachContentServerListeners(restart.container);
					resolveRestart(null);
				}
				restartComplete = new Promise<Error | null>((resolve) => {
					resolveRestart = resolve;
				});
			}
		};
	}

	let changeHandler: (file: string) => void;
	let unlinkHandler: (file: string) => void;
	let addHandler: (file: string) => void;

	function setupContainer() {
		const watcher = restart.container.viteServer.watcher;
		if (changeHandler) watcher.off('change', changeHandler);
		if (unlinkHandler) watcher.off('unlink', unlinkHandler);
		if (addHandler) watcher.off('add', addHandler);
		changeHandler = handleChangeRestart('Configuration file updated.');
		unlinkHandler = handleChangeRestart('Configuration file removed.');
		addHandler = handleChangeRestart('Configuration file added.');
		watcher.on('change', changeHandler);
		watcher.on('unlink', unlinkHandler);
		watcher.on('add', addHandler);
	}

	setupContainer();
	return restart;
}
