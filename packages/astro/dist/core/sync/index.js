import fsMod from 'node:fs';
import { dirname, relative } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import colors from 'piccolore';
import { createServer } from 'vite';
import { syncFonts } from '../../assets/fonts/sync.js';
import { CONTENT_TYPES_FILE } from '../../content/consts.js';
import { getDataStoreFile } from '../../content/content-layer.js';
import { globalContentLayer } from '../../content/instance.js';
import { createContentTypesGenerator } from '../../content/index.js';
import { MutableDataStore } from '../../content/mutable-data-store.js';
import { getContentPaths, globalContentConfigObserver } from '../../content/utils.js';
import { syncAstroEnv } from '../../env/sync.js';
import { telemetry } from '../../events/index.js';
import { eventCliSession } from '../../events/session.js';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/hooks.js';
import { getTimeStat } from '../build/util.js';
import { resolveConfig } from '../config/config.js';
import { loadOrCreateNodeLogger } from '../logger/load.js';
import { createSettings } from '../config/settings.js';
import { createVite } from '../create-vite.js';
import {
	AstroError,
	AstroErrorData,
	AstroUserError,
	createSafeError,
	isAstroError,
} from '../errors/index.js';
import { createRoutesList } from '../routing/create-manifest.js';
import { ensureProcessNodeEnv } from '../util.js';
import { normalizePath } from '../viteUtils.js';
async function sync(inlineConfig, { fs, telemetry: _telemetry = false } = {}) {
	ensureProcessNodeEnv('production');
	const { astroConfig, userConfig } = await resolveConfig(inlineConfig ?? {}, 'sync');
	const logger = await loadOrCreateNodeLogger(astroConfig, inlineConfig ?? {});
	if (_telemetry) {
		telemetry.record(eventCliSession('sync', userConfig));
	}
	let settings = await createSettings(astroConfig, inlineConfig.logLevel, inlineConfig.root);
	settings = await runHookConfigSetup({
		command: 'sync',
		settings,
		logger,
	});
	await runHookConfigDone({ settings, logger });
	return await syncInternal({
		settings,
		logger,
		mode: 'production',
		fs,
		force: inlineConfig.force,
		command: 'sync',
	});
}
async function clearContentLayerCache({ settings, logger, fs = fsMod, isDev }) {
	const dataStore = getDataStoreFile(settings, isDev);
	if (fs.existsSync(dataStore)) {
		logger.debug('content', 'clearing data store');
		await fs.promises.rm(dataStore, { force: true });
		logger.warn('content', 'data store cleared (force)');
	}
}
async function syncInternal({ mode, logger, fs = fsMod, settings, skip, force, command, watcher }) {
	const isDev = command === 'dev';
	if (force) {
		await clearContentLayerCache({ settings, logger, fs, isDev });
	}
	const timerStart = performance.now();
	if (!skip?.content) {
		const tempViteServer = await createTempViteServer(settings, { mode, fs, logger });
		try {
			await syncContentCollections(settings, { fs, logger, viteServer: tempViteServer });
			settings.timer.start('Sync content layer');
			let store;
			try {
				const dataStoreFile = getDataStoreFile(settings, isDev);
				store = await MutableDataStore.fromFile(dataStoreFile);
			} catch (err) {
				logger.error('content', err.message);
			}
			if (!store) {
				logger.error('content', 'Failed to load content store');
				return;
			}
			const contentLayer = globalContentLayer.init({
				settings,
				logger,
				store,
				watcher,
			});
			if (watcher) {
				contentLayer.watchContentConfig();
			}
			await contentLayer.sync();
			if (!skip?.cleanup) {
				contentLayer.dispose();
			}
			settings.timer.end('Sync content layer');
		} finally {
			await tempViteServer.close();
		}
	} else {
		const paths = getContentPaths(
			settings.config,
			fs,
			settings.config.legacy?.collectionsBackwardsCompat,
		);
		if (paths.config.exists || paths.liveConfig.exists) {
			settings.injectedTypes.push({
				filename: CONTENT_TYPES_FILE,
			});
		}
	}
	syncAstroEnv(settings);
	syncFonts(settings);
	writeInjectedTypes(settings, fs);
	logger.info('types', `Generated ${colors.dim(getTimeStat(timerStart, performance.now()))}`);
}
function getTsReference(type, value) {
	return `/// <reference ${type}=${JSON.stringify(value)} />`;
}
const CLIENT_TYPES_REFERENCE = getTsReference('types', 'astro/client');
function writeInjectedTypes(settings, fs) {
	const references = [];
	for (const { filename, content } of settings.injectedTypes) {
		const filepath = fileURLToPath(new URL(filename, settings.dotAstroDir));
		fs.mkdirSync(dirname(filepath), { recursive: true });
		if (content) {
			fs.writeFileSync(filepath, content, 'utf-8');
		}
		references.push(normalizePath(relative(fileURLToPath(settings.dotAstroDir), filepath)));
	}
	const astroDtsContent = `${CLIENT_TYPES_REFERENCE}
${references.map((reference) => getTsReference('path', reference)).join('\n')}`;
	if (references.length === 0) {
		fs.mkdirSync(settings.dotAstroDir, { recursive: true });
	}
	fs.writeFileSync(
		fileURLToPath(new URL('./types.d.ts', settings.dotAstroDir)),
		astroDtsContent,
		'utf-8',
	);
}
async function createTempViteServer(settings, { mode, logger, fs }) {
	const routesList = await createRoutesList(
		{
			settings,
			fsMod: fs,
		},
		logger,
		{ dev: true },
	);
	const tempViteServer = await createServer(
		await createVite(
			{
				server: { middlewareMode: true, hmr: false, watch: null, ws: false },
				optimizeDeps: { noDiscovery: true },
				ssr: { external: [] },
				logLevel: 'silent',
			},
			{
				routesList,
				settings: {
					...settings,
					// Prevent mutation by vite plugins during sync
					buildOutput: void 0,
					// Sync causes font resources and style hashes to be duplicated
					injectedCsp: {
						fontResources: /* @__PURE__ */ new Set(),
						styleHashes: [],
					},
				},
				logger,
				mode,
				command: 'build',
				fs,
				sync: true,
			},
		),
	);
	const hotSend = tempViteServer.environments.client.hot.send;
	tempViteServer.environments.client.hot.send = (payload) => {
		if (payload.type === 'error') {
			throw payload.err;
		}
		return hotSend(payload);
	};
	return tempViteServer;
}
async function syncContentCollections(settings, { logger, fs, viteServer }) {
	try {
		const contentTypesGenerator = await createContentTypesGenerator({
			contentConfigObserver: globalContentConfigObserver,
			logger,
			fs,
			settings,
			viteServer,
		});
		await contentTypesGenerator.init();
		const contentConfig = globalContentConfigObserver.get();
		if (contentConfig.status === 'error') {
			throw contentConfig.error;
		}
	} catch (e) {
		const safeError = createSafeError(e);
		if (isAstroError(e)) {
			throw e;
		}
		let configFile;
		try {
			const contentPaths = getContentPaths(
				settings.config,
				fs,
				settings.config.legacy?.collectionsBackwardsCompat,
			);
			if (contentPaths.config.exists) {
				const matches = /\/(src\/.+)/.exec(contentPaths.config.url.href);
				if (matches) {
					configFile = matches[1];
				}
			}
		} catch {}
		const hint = AstroUserError.is(e)
			? e.hint
			: AstroErrorData.GenerateContentTypesError.hint(configFile);
		throw new AstroError(
			{
				...AstroErrorData.GenerateContentTypesError,
				hint,
				message: AstroErrorData.GenerateContentTypesError.message(safeError.message),
				location: safeError.loc,
			},
			{ cause: e },
		);
	}
}
export { clearContentLayerCache, sync as default, syncInternal };
