import fsMod, { existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { dim } from 'kleur/colors';
import { type HMRPayload, createServer } from 'vite';
import type { AstroInlineConfig, AstroSettings } from '../../@types/astro.js';
import { CONTENT_TYPES_FILE } from '../../content/consts.js';
import { getDataStoreFile, globalContentLayer } from '../../content/content-layer.js';
import { createContentTypesGenerator } from '../../content/index.js';
import { MutableDataStore } from '../../content/mutable-data-store.js';
import { getContentPaths, globalContentConfigObserver } from '../../content/utils.js';
import { syncAstroEnv } from '../../env/sync.js';
import { telemetry } from '../../events/index.js';
import { eventCliSession } from '../../events/session.js';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/hooks.js';
import { getTimeStat } from '../build/util.js';
import { resolveConfig } from '../config/config.js';
import { createNodeLogger } from '../config/logging.js';
import { createSettings } from '../config/settings.js';
import { createVite } from '../create-vite.js';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import {
	AstroError,
	AstroErrorData,
	AstroUserError,
	type ErrorWithMetadata,
	createSafeError,
	isAstroError,
} from '../errors/index.js';
import type { Logger } from '../logger/core.js';
import { formatErrorMessage } from '../messages.js';
import { ensureProcessNodeEnv } from '../util.js';
import { writeFiles } from './write-files.js';

export type SyncOptions = {
	/**
	 * @internal only used for testing
	 */
	fs?: typeof fsMod;
	logger: Logger;
	settings: AstroSettings;
	force?: boolean;
	skip?: {
		// Must be skipped in dev
		content?: boolean;
	};
};

export default async function sync(
	inlineConfig: AstroInlineConfig,
	{ fs, telemetry: _telemetry = false }: { fs?: typeof fsMod; telemetry?: boolean } = {},
) {
	ensureProcessNodeEnv('production');
	const logger = createNodeLogger(inlineConfig);
	const { astroConfig, userConfig } = await resolveConfig(inlineConfig ?? {}, 'sync');
	if (_telemetry) {
		telemetry.record(eventCliSession('sync', userConfig));
	}
	let settings = await createSettings(astroConfig, inlineConfig.root);
	settings = await runHookConfigSetup({
		command: 'sync',
		settings,
		logger,
	});

	await runHookConfigDone({ settings, logger });

	return await syncInternal({ settings, logger, fs, force: inlineConfig.force });
}

/**
 * Clears the content layer and content collection cache, forcing a full rebuild.
 */
export async function clearContentLayerCache({
	settings,
	logger,
	fs = fsMod,
}: { settings: AstroSettings; logger: Logger; fs?: typeof fsMod }) {
	const dataStore = getDataStoreFile(settings);
	if (fs.existsSync(dataStore)) {
		logger.debug('content', 'clearing data store');
		await fs.promises.rm(dataStore, { force: true });
		logger.warn('content', 'data store cleared (force)');
	}
}

/**
 * Generates TypeScript types for all Astro modules. This sets up a `src/env.d.ts` file for type inferencing,
 * and defines the `astro:content` module for the Content Collections API.
 *
 * @experimental The JavaScript API is experimental
 */
export async function syncInternal({
	logger,
	fs = fsMod,
	settings,
	skip,
	force,
}: SyncOptions): Promise<void> {
	if (force) {
		await clearContentLayerCache({ settings, logger, fs });
	}

	const timerStart = performance.now();

	if (!skip?.content) {
		await syncContentCollections(settings, { fs, logger });
		settings.timer.start('Sync content layer');
		let store: MutableDataStore | undefined;
		try {
			const dataStoreFile = getDataStoreFile(settings);
			if (existsSync(dataStoreFile)) {
				store = await MutableDataStore.fromFile(dataStoreFile);
			}
		} catch (err: any) {
			logger.error('content', err.message);
		}
		if (!store) {
			store = new MutableDataStore();
		}
		const contentLayer = globalContentLayer.init({
			settings,
			logger,
			store,
		});
		await contentLayer.sync();
		settings.timer.end('Sync content layer');
	} else if (fs.existsSync(fileURLToPath(getContentPaths(settings.config, fs).contentDir))) {
		// Content is synced after writeFiles. That means references are not created
		// To work around it, we create a stub so the reference is created and content
		// sync will override the empty file
		settings.injectedTypes.push({
			filename: CONTENT_TYPES_FILE,
			content: '',
		});
	}
	syncAstroEnv(settings, fs);

	await writeFiles(settings, fs, logger);
	logger.info('types', `Generated ${dim(getTimeStat(timerStart, performance.now()))}`);
}

/**
 * Generate content collection types, and then returns the process exit signal.
 *
 * A non-zero process signal is emitted in case there's an error while generating content collection types.
 *
 * This should only be used when the callee already has an `AstroSetting`, otherwise use `sync()` instead.
 * @internal
 *
 * @param {SyncOptions} options
 * @param {AstroSettings} settings Astro settings
 * @param {typeof fsMod} options.fs The file system
 * @param {LogOptions} options.logging Logging options
 * @return {Promise<ProcessExit>}
 */
async function syncContentCollections(
	settings: AstroSettings,
	{ logger, fs }: Required<Pick<SyncOptions, 'logger' | 'fs'>>,
): Promise<void> {
	// Needed to load content config
	const tempViteServer = await createServer(
		await createVite(
			{
				server: { middlewareMode: true, hmr: false, watch: null, ws: false },
				optimizeDeps: { noDiscovery: true },
				ssr: { external: [] },
				logLevel: 'silent',
			},
			{ settings, logger, mode: 'build', command: 'build', fs, sync: true },
		),
	);

	// Patch `hot.send` to bubble up error events
	// `hot.on('error')` does not fire for some reason
	const hotSend = tempViteServer.hot.send;
	tempViteServer.hot.send = (payload: HMRPayload) => {
		if (payload.type === 'error') {
			throw payload.err;
		}
		return hotSend(payload);
	};

	try {
		const contentTypesGenerator = await createContentTypesGenerator({
			contentConfigObserver: globalContentConfigObserver,
			logger: logger,
			fs,
			settings,
			viteServer: tempViteServer,
		});
		const typesResult = await contentTypesGenerator.init();

		const contentConfig = globalContentConfigObserver.get();
		if (contentConfig.status === 'error') {
			throw contentConfig.error;
		}

		if (typesResult.typesGenerated === false) {
			switch (typesResult.reason) {
				case 'no-content-dir':
				default:
					logger.debug('types', 'No content directory found. Skipping type generation.');
			}
		}
	} catch (e) {
		const safeError = createSafeError(e) as ErrorWithMetadata;
		if (isAstroError(e)) {
			throw e;
		}
		const hint = AstroUserError.is(e) ? e.hint : AstroErrorData.GenerateContentTypesError.hint;
		throw new AstroError(
			{
				...AstroErrorData.GenerateContentTypesError,
				hint,
				message: AstroErrorData.GenerateContentTypesError.message(safeError.message),
				location: safeError.loc,
			},
			{ cause: e },
		);
	} finally {
		await tempViteServer.close();
	}
}
