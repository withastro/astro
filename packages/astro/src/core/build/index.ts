import fs from 'fs';
import * as colors from 'kleur/colors';
import { performance } from 'perf_hooks';
import type * as vite from 'vite';
import type yargs from 'yargs-parser';
import type { AstroConfig, AstroSettings, ManifestData, RuntimeMode } from '../../@types/astro';
import {
	runHookBuildDone,
	runHookBuildStart,
	runHookConfigDone,
	runHookConfigSetup,
} from '../../integrations/index.js';
import { createVite } from '../create-vite.js';
import { debug, info, levels, timerMessage, warn, type LogOptions } from '../logger/core.js';
import { printHelp } from '../messages.js';
import { apply as applyPolyfill } from '../polyfill.js';
import { RouteCache } from '../render/route-cache.js';
import { createRouteManifest } from '../routing/index.js';
import { collectPagesData } from './page-data.js';
import { staticBuild, viteBuild } from './static-build.js';
import type { StaticBuildOptions } from './types.js';
import { getTimeStat } from './util.js';

export interface BuildOptions {
	mode?: RuntimeMode;
	logging: LogOptions;
	/**
	 * Teardown the compiler WASM instance after build. This can improve performance when
	 * building once, but may cause a performance hit if building multiple times in a row.
	 */
	teardownCompiler?: boolean;
	flags?: yargs.Arguments;
}

/** `astro build` */
export default async function build(settings: AstroSettings, options: BuildOptions): Promise<void> {
	applyPolyfill();
	if (options.flags?.help || options.flags?.h) {
		printHelp({
			commandName: 'astro build',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--drafts', `Include Markdown draft pages in the build.`],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Builds your site for deployment.`,
		});
		return;
	}

	const builder = new AstroBuilder(settings, options);
	await builder.run();
}

class AstroBuilder {
	private settings: AstroSettings;
	private logging: LogOptions;
	private mode: RuntimeMode = 'production';
	private origin: string;
	private routeCache: RouteCache;
	private manifest: ManifestData;
	private timer: Record<string, number>;
	private teardownCompiler: boolean;

	constructor(settings: AstroSettings, options: BuildOptions) {
		if (options.mode) {
			this.mode = options.mode;
		}
		this.settings = settings;
		this.logging = options.logging;
		this.teardownCompiler = options.teardownCompiler ?? false;
		this.routeCache = new RouteCache(this.logging);
		this.origin = settings.config.site
			? new URL(settings.config.site).origin
			: `http://localhost:${settings.config.server.port}`;
		this.manifest = { routes: [] };
		this.timer = {};
	}

	/** Setup Vite and run any async setup logic that couldn't run inside of the constructor. */
	private async setup() {
		debug('build', 'Initial setup...');
		const { logging } = this;
		this.timer.init = performance.now();
		this.settings = await runHookConfigSetup({
			settings: this.settings,
			command: 'build',
			logging,
		});
		this.manifest = createRouteManifest({ settings: this.settings }, this.logging);

		const viteConfig = await createVite(
			{
				mode: this.mode,
				server: {
					hmr: false,
					middlewareMode: true,
				},
			},
			{ settings: this.settings, logging, mode: 'build', command: 'build' }
		);
		await runHookConfigDone({ settings: this.settings, logging });

		const { sync } = await import('../sync/index.js');
		const syncRet = await sync(this.settings, { logging, fs });
		if (syncRet !== 0) {
			return process.exit(syncRet);
		}

		return { viteConfig };
	}

	/** Run the build logic. build() is marked private because usage should go through ".run()" */
	private async build({ viteConfig }: { viteConfig: vite.InlineConfig }) {
		await runHookBuildStart({ config: this.settings.config, logging: this.logging });
		this.validateConfig();

		info(this.logging, 'build', `output target: ${colors.green(this.settings.config.output)}`);
		if (this.settings.adapter) {
			info(this.logging, 'build', `deploy adapter: ${colors.green(this.settings.adapter.name)}`);
		}
		info(this.logging, 'build', 'Collecting build info...');
		this.timer.loadStart = performance.now();
		const { assets, allPages } = await collectPagesData({
			settings: this.settings,
			logging: this.logging,
			manifest: this.manifest,
		});

		debug('build', timerMessage('All pages loaded', this.timer.loadStart));

		// The names of each pages
		const pageNames: string[] = [];

		// Bundle the assets in your final build: This currently takes the HTML output
		// of every page (stored in memory) and bundles the assets pointed to on those pages.
		this.timer.buildStart = performance.now();
		info(
			this.logging,
			'build',
			colors.dim(`Completed in ${getTimeStat(this.timer.init, performance.now())}.`)
		);

		const opts: StaticBuildOptions = {
			allPages,
			settings: this.settings,
			logging: this.logging,
			manifest: this.manifest,
			mode: this.mode,
			origin: this.origin,
			pageNames,
			routeCache: this.routeCache,
			teardownCompiler: this.teardownCompiler,
			viteConfig,
		};

		const { internals } = await viteBuild(opts);
		await staticBuild(opts, internals);

		// Write any additionally generated assets to disk.
		this.timer.assetsStart = performance.now();
		Object.keys(assets).map((k) => {
			if (!assets[k]) return;
			const filePath = new URL(`file://${k}`);
			fs.mkdirSync(new URL('./', filePath), { recursive: true });
			fs.writeFileSync(filePath, assets[k], 'utf8');
			delete assets[k]; // free up memory
		});
		debug('build', timerMessage('Additional assets copied', this.timer.assetsStart));

		// You're done! Time to clean up.
		await runHookBuildDone({
			config: this.settings.config,
			pages: pageNames,
			routes: Object.values(allPages).map((pd) => pd.route),
			logging: this.logging,
		});

		if (this.logging.level && levels[this.logging.level] <= levels['info']) {
			await this.printStats({
				logging: this.logging,
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

		if (config.build.split === true) {
			if (config.output === 'static') {
				warn(
					this.logging,
					'configuration',
					'The option `build.split` won\'t take effect, because `output` is not `"server"` or `"hybrid"`.'
				);
			}
		}
		if (config.build.excludeMiddleware === true) {
			if (config.output === 'static') {
				warn(
					this.logging,
					'configuration',
					'The option `build.excludeMiddleware` won\'t take effect, because `output` is not `"server"` or `"hybrid"`.'
				);
			}
		}
	}

	/** Stats */
	private async printStats({
		logging,
		timeStart,
		pageCount,
		buildMode,
	}: {
		logging: LogOptions;
		timeStart: number;
		pageCount: number;
		buildMode: AstroConfig['output'];
	}) {
		const total = getTimeStat(timeStart, performance.now());

		let messages: string[] = [];
		if (buildMode === 'static') {
			messages = [`${pageCount} page(s) built in`, colors.bold(total)];
		} else {
			messages = ['Server built in', colors.bold(total)];
		}

		info(logging, 'build', messages.join(' '));
		info(logging, 'build', `${colors.bold('Complete!')}`);
	}
}
