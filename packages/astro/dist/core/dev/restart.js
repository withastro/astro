import { fileURLToPath } from 'node:url';
import * as vite from 'vite';
import { globalContentLayer } from '../../content/instance.js';
import { attachContentServerListeners } from '../../content/server-listeners.js';
import { eventCliSession, telemetry } from '../../events/index.js';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/hooks.js';
import { SETTINGS_FILE } from '../../preferences/constants.js';
import { getPrerenderDefault } from '../../prerender/utils.js';
import { createSettings, resolveConfig } from '../config/index.js';
import { clearCrawlCache, createVite } from '../create-vite.js';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import { isAstroConfigZodError } from '../errors/errors.js';
import { createSafeError } from '../errors/index.js';
import { loadOrCreateNodeLogger } from '../logger/load.js';
import { formatErrorMessage, warnIfCspWithShiki } from '../messages/runtime.js';
import { createRoutesList } from '../routing/create-manifest.js';
import { createContainer } from './container.js';
const configRE = /.*astro.config.(?:mjs|mts|cjs|cts|js|ts)$/;
function shouldRestartContainer({ settings, inlineConfig, restartInFlight }, changedFile) {
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
async function restartContainerInPlace(container) {
	const { logger, settings: existingSettings, inlineConfig, fs } = container;
	container.restartInFlight = true;
	clearCrawlCache();
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
		const rendererClientEntries = settings.renderers.map((r) => r.clientEntrypoint).filter(Boolean);
		const routesList = await createRoutesList({ settings, fsMod: fs }, logger, { dev: true });
		const address = container.viteServer.httpServer?.address();
		const port = address !== null && typeof address === 'object' ? address.port : void 0;
		const newViteConfig = await createVite(
			{
				server: { host, headers, allowedHosts, port },
				optimizeDeps: { include: rendererClientEntries },
			},
			{ settings, logger, mode, command: 'dev', fs, sync: false, routesList },
		);
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
async function createContainerWithAutomaticRestart({ inlineConfig, fs }) {
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, 'dev', fs);
	const logger = await loadOrCreateNodeLogger(astroConfig, inlineConfig ?? {});
	warnIfCspWithShiki(astroConfig, logger);
	telemetry.record(eventCliSession('dev', userConfig));
	const settings = await createSettings(
		astroConfig,
		inlineConfig?.logLevel,
		fileURLToPath(astroConfig.root),
	);
	const initialContainer = await createContainer({
		settings,
		logger,
		inlineConfig,
		fs,
	});
	let resolveRestart;
	let restartComplete = new Promise((resolve) => {
		resolveRestart = resolve;
	});
	let restart = {
		container: initialContainer,
		bindCLIShortcuts() {
			const customShortcuts = [
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
	function handleChangeRestart(logMsg) {
		return async function (changedFile) {
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
				restartComplete = new Promise((resolve) => {
					resolveRestart = resolve;
				});
			}
		};
	}
	let changeHandler;
	let unlinkHandler;
	let addHandler;
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
export { createContainerWithAutomaticRestart };
