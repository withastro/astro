import type { PipelineModule } from '../../../index.js';
import type { SSRManifest } from '../app/types.js';
import { createAsyncManifestMemo } from '../manifest/memo.js';
import type { FetchState } from './fetch-state.js';

const EMPTY_PIPELINE: PipelineModule = { fetchHandlers: [], renderContextExtensions: [] };

const loadedPipelines = new WeakMap<SSRManifest, PipelineModule>();

const pipelineMemo = createAsyncManifestMemo(async (manifest: SSRManifest) => {
	const pipeline = manifest.pipeline ? await manifest.pipeline() : EMPTY_PIPELINE;
	loadedPipelines.set(manifest, pipeline);
	return pipeline;
});

/**
 * Loads the fetch handlers and render context extensions registered with `api.astroRouter`
 * (`manifest.pipeline`). Memoized per manifest; a manifest without `pipeline` has none.
 */
export function loadPipeline(manifest: SSRManifest): Promise<PipelineModule> {
	return pipelineMemo.get(manifest);
}

/** The pipeline of `manifest` if {@link loadPipeline} already resolved, else `undefined`. */
export function getLoadedPipeline(manifest: SSRManifest): PipelineModule | undefined {
	return loadedPipelines.get(manifest);
}

/**
 * Calls every registered render context extension and provides the returned values on `state`.
 * Returns synchronously when no extension is asynchronous.
 */
export function applyRenderContextExtensions(
	state: FetchState,
	pipeline: PipelineModule,
): Promise<void> | void {
	let pending: Promise<void>[] | undefined;
	for (const { key, extension } of pipeline.renderContextExtensions) {
		const provider = extension(state);
		if (provider instanceof Promise) {
			(pending ??= []).push(
				provider.then((p) => {
					if (p) state.provide(key, p);
				}),
			);
		} else if (provider) {
			state.provide(key, provider);
		}
	}
	if (pending) return Promise.all(pending).then(() => undefined);
}
