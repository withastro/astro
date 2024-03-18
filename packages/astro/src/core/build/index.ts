import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { blue, bold, green } from 'kleur/colors';
import type * as vite from 'vite';
import type {
	AstroConfig,
	AstroInlineConfig,
	AstroSettings,
	ManifestData,
	RuntimeMode,
} from '../../@types/astro.js';
import { injectImageEndpoint } from '../../assets/endpoint/config.js';
import { telemetry } from '../../events/index.js';
import { eventCliSession } from '../../events/session.js';
import {
	runHookBuildDone,
	runHookBuildStart,
	runHookConfigDone,
	runHookConfigSetup,
} from '../../integrations/index.js';
import { isServerLikeOutput } from '../../prerender/utils.js';
import { resolveConfig } from '../config/config.js';
import { createNodeLogger } from '../config/logging.js';
import { createSettings } from '../config/settings.js';
import { createVite } from '../create-vite.js';
import type { Logger } from '../logger/core.js';
import { levels, timerMessage } from '../logger/core.js';
import { apply as applyPolyfill } from '../polyfill.js';
import { createRouteManifest } from '../routing/index.js';
import { ensureProcessNodeEnv } from '../util.js';
import { collectPagesData } from './page-data.js';
import { staticBuild, viteBuild } from './static-build.js';
import type { StaticBuildOptions } from './types.js';
import { getTimeStat } from './util.js';

export interface BuildOptions {
	/**
	 * Teardown the compiler WASM instance after build. This can improve performance when
	 * building once, but may cause a performance hit if building multiple times in a row.
	 *
	 * @internal only used for testing
	 * @default true
	 */
	teardownCompiler?: boolean;

	/**
	 * If `experimental.contentCollectionCache` is enabled, this flag will clear the cache before building
	 *
	 * @internal not part of our public api
	 * @default false
	 */
	force?: boolean;
}

/**
 * Builds your site for deployment. By default, this will generate static files and place them in a dist/ directory.
 * If SSR is enabled, this will generate the necessary server files to serve your site.
 *
 * @experimental The JavaScript API is experimental
 */
export default async function build(
	inlineConfig: AstroInlineConfig,
	options: BuildOptions = {}
): Promise<void> {
	ensureProcessNodeEnv('production');
	applyPolyfill();
	const logger = createNodeLogger(inlineConfig);
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig, 'build');
	telemetry.record(eventCliSession('build', userConfig));
	if (astroConfig.experimental.contentCollectionCache && options.force) {
		const contentCacheDir = new URL('./content/', astroConfig.cacheDir);
		if (fs.existsSync(contentCacheDir)) {
			logger.debug('content', 'clearing content cache');
			await fs.promises.rm(contentCacheDir, { force: true, recursive: true });
			logger.warn('content', 'content cache cleared (force)');
		}
	}

	const settings = await createSettings(astroConfig, fileURLToPath(astroConfig.root));

	const builder = new AstroBuilder(settings, {
		...options,
		logger,
		mode: inlineConfig.mode,
	});
	await builder.run();
}

interface AstroBuilderOptions extends BuildOptions {
	logger: Logger;
	mode?: RuntimeMode;
}

class AstroBuilder {
	private settings: AstroSettings;
	private logger: Logger;
	private mode: RuntimeMode = 'production';
	private origin: string;
	private manifest: ManifestData;
	private timer: Record<string, number>;
	private teardownCompiler: boolean;

	constructor(settings: AstroSettings, options: AstroBuilderOptions) {
		if (options.mode) {
			this.mode = options.mode;
		}
		this.settings = settings;
		this.logger = options.logger;
		this.teardownCompiler = options.teardownCompiler ?? true;
		this.origin = settings.config.site
			? new URL(settings.config.site).origin
			: `http://localhost:${settings.config.server.port}`;
		this.manifest = { routes: [] };
		this.timer = {};
	}

	/** Setup Vite and run any async setup logic that couldn't run inside of the constructor. */
	private async setup() {
		this.logger.debug('build', 'Initial setup...');
		const { logger } = this;
		this.timer.init = performance.now();
		this.settings = await runHookConfigSetup({
			settings: this.settings,
			command: 'build',
			logger: logger,
		});

		if (isServerLikeOutput(this.settings.config)) {
			this.settings = injectImageEndpoint(this.settings, 'build');
		}

		this.manifest = createRouteManifest({ settings: this.settings }, this.logger);

		const viteConfig = await createVite(
			{
				mode: this.mode,
				server: {
					hmr: false,
					middlewareMode: true,
				},
			},
			{ settings: this.settings, logger: this.logger, mode: 'build', command: 'build' }
		);
		await runHookConfigDone({ settings: this.settings, logger: logger });

		const { syncContentCollections } = await import('../sync/index.js');
		const syncRet = await syncContentCollections(this.settings, { logger: logger, fs });
		if (syncRet !== 0) {
			return process.exit(syncRet);
		}

		return { viteConfig };
	}

	/** Run the build logic. build() is marked private because usage should go through ".run()" */
	private async build({ viteConfig }: { viteConfig: vite.InlineConfig }) {
		await runHookBuildStart({ config: this.settings.config, logging: this.logger });
		this.validateConfig();

		this.logger.info('build', `output: ${blue('"' + this.settings.config.output + '"')}`);
		this.logger.info('build', `directory: ${blue(fileURLToPath(this.settings.config.outDir))}`);
		if (this.settings.adapter) {
			this.logger.info('build', `adapter: ${green(this.settings.adapter.name)}`);
		}
		this.logger.info('build', 'Collecting build info...');
		this.timer.loadStart = performance.now();
		const { assets, allPages } = await collectPagesData({
			settings: this.settings,
			logger: this.logger,
			manifest: this.manifest,
		});

		this.logger.debug('build', timerMessage('All pages loaded', this.timer.loadStart));

		// The names of each pages
		const pageNames: string[] = [];

		// Bundle the assets in your final build: This currently takes the HTML output
		// of every page (stored in memory) and bundles the assets pointed to on those pages.
		this.timer.buildStart = performance.now();
		this.logger.info(
			'build',
			green(`✓ Completed in ${getTimeStat(this.timer.init, performance.now())}.`)
		);

		const opts: StaticBuildOptions = {
			allPages,
			settings: this.settings,
			logger: this.logger,
			manifest: this.manifest,
			mode: this.mode,
			origin: this.origin,
			pageNames,
			teardownCompiler: this.teardownCompiler,
			viteConfig,
		};

		const { internals, ssrOutputChunkNames } = await viteBuild(opts);
		await staticBuild(opts, internals, ssrOutputChunkNames);

		// Write any additionally generated assets to disk.
		this.timer.assetsStart = performance.now();
		Object.keys(assets).map((k) => {
			if (!assets[k]) return;
			const filePath = new URL(`file://${k}`);
			fs.mkdirSync(new URL('./', filePath), { recursive: true });
			fs.writeFileSync(filePath, assets[k], 'utf8');
			delete assets[k]; // free up memory
		});
		this.logger.debug('build', timerMessage('Additional assets copied', this.timer.assetsStart));

		// You're done! Time to clean up.
		await runHookBuildDone({
			config: this.settings.config,
			pages: pageNames,
			routes: Object.values(allPages)
				.flat()
				.map((pageData) => pageData.route),
			logging: this.logger,
		});

		if (this.logger.level && levels[this.logger.level()] <= levels['info']) {
			await this.printStats({
				logger: this.logger,
				timeStart: this.timer.init,
				pageCount: pageNames.length,
				buildMode: this.settings.config.output,
			});
		}

		// Benchmark results
		this.settings.timer.writeStats();
	}

	/** Build the given Astro project.  */
	async run() {
		const setupData = await this.setup();
		try {
			await this.build(setupData);
		} catch (_err) {
			throw _err;
		}
	}

	private validateConfig() {
		const { config } = this.settings;

		// outDir gets blown away so it can't be the root.
		if (config.outDir.toString() === config.root.toString()) {
			throw new Error(
				`the outDir cannot be the root folder. Please build to a folder such as dist.`
			);
		}
	}

	/** Stats */
	private async printStats({
		logger,
		timeStart,
		pageCount,
		buildMode,
	}: {
		logger: Logger;
		timeStart: number;
		pageCount: number;
		buildMode: AstroConfig['output'];
	}) {
		const total = getTimeStat(timeStart, performance.now());

		let messages: string[] = [];
		if (buildMode === 'static') {
			messages = [`${pageCount} page(s) built in`, bold(total)];
		} else {
			messages = ['Server built in', bold(total)];
		}

		logger.info('build', messages.join(' '));
		logger.info('build', `${bold('Complete!')}`);
	}
}
