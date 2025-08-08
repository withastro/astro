import { BaseApp } from '../core/app/index.js';
import type { SSRManifest } from '../core/app/types.js';
import type { Logger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { DevPipeline } from './pipeline.js';

export class DevApp extends BaseApp<DevPipeline> {
	settings: AstroSettings;
	logger: Logger;
	loader: ModuleLoader;
	manifestData: RoutesList;
	constructor(
		manifest: SSRManifest,
		streaming = true,
		settings: AstroSettings,
		logger: Logger,
		loader: ModuleLoader,
		manifestData: RoutesList,
	) {
		super(manifest, streaming);
		this.settings = settings;
		this.logger = logger;
		this.loader = loader;
		this.manifestData = manifestData;
	}

	createPipeline(_streaming: boolean): DevPipeline {
		return DevPipeline.create(this.manifestData, {
			loader: this.loader,
			logger: this.logger,
			manifest: this.manifest,
			settings: this.settings,
		});
	}
}
