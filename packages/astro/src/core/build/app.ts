import { BaseApp } from '../app/entrypoints/index.js';
import type { LogRequestPayload } from '../app/base.js';
import { AppPipeline } from '../app/pipeline.js';
import type { SSRManifest } from '../app/types.js';
import type { BuildEnvironmentSlots } from './environment.js';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';

/**
 * The build / prerender facade: a thin shell over the
 * build environment record. The two-phase init state (`setInternals` /
 * `setOptions`, injected by `createDefaultPrerenderer.setup()` after the
 * prerender bundle import) lives in the `BuildEnvironmentSlots` closure
 * created by the prerender entrypoint; the facade only forwards across the
 * bundle boundary into those slots.
 */
export class BuildApp extends BaseApp {
	#buildEnv: BuildEnvironmentSlots;

	constructor(manifest: SSRManifest, buildEnv: BuildEnvironmentSlots) {
		// BaseApp ctor: warms the route table via the pipeline shim.
		super(manifest);
		this.#buildEnv = buildEnv;
	}

	createPipeline(streaming: boolean): AppPipeline {
		return AppPipeline.create({ manifest: this.manifest, streaming });
	}

	isDev(): boolean {
		// Preserved quirk: the build app reports dev so shared code paths keep
		// their build-time behavior.
		return true;
	}

	/**
	 * Streaming falls through to the environment default
	 * (`manifest.serverLike` for the build environment) — we can skip
	 * streaming in SSG for performance, as writing strings is faster.
	 */
	protected override resolveStreaming(): boolean | undefined {
		return undefined;
	}

	public setInternals(internals: BuildInternals) {
		this.#buildEnv.setInternals(internals);
	}

	public setOptions(options: StaticBuildOptions) {
		this.#buildEnv.setOptions(options);
		this.logger.setDestination(options.logger.options.destination);
		this.resetAdapterLogger();
	}

	public getOptions() {
		return this.#buildEnv.getOptions();
	}

	public getSettings() {
		return this.#buildEnv.getSettings();
	}

	logRequest(_options: LogRequestPayload) {}
}
