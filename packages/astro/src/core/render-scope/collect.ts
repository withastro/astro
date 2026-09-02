import type { SerializedStaticImage } from '../../assets/types.js';
import type { AstroLogger } from '../logger/core.js';
import { getInstalledRenderScope, type RenderCollectors } from './scope.js';

export interface CollectedPrerenderMetadata {
	contentEntryKeys: string[];
	staticImages: SerializedStaticImage[];
}

let warnedNoScope = false;

/**
 * Runs `fn` inside a fresh per-render collectors store and returns its value
 * together with a snapshot of everything recorded while it ran.
 *
 * When no render scope is installed, collection degrades to *not collecting*:
 * warn once per process, run `fn` bare, and return `metadata: undefined`
 * ("not tracked") — never wrong attribution.
 *
 * Invariant: `fn` must not resolve until all recordable work is done — in
 * practice, until the response body is fully buffered inside `fn`. The
 * snapshot is taken by copy when `fn` resolves, so a late-arriving record (a
 * floating promise carrying the async context past buffering) mutates only the
 * abandoned store, never the returned metadata.
 */
export async function collectPrerenderMetadata<T>(
	fn: () => Promise<T>,
	logger: AstroLogger,
): Promise<{ value: T; metadata: CollectedPrerenderMetadata | undefined }> {
	const scope = getInstalledRenderScope();
	if (!scope) {
		if (!warnedNoScope) {
			warnedNoScope = true;
			logger.warn(
				'build',
				'A prerenderer requested metadata collection but no render scope is installed; ' +
					'install one with `installRenderScope` from `astro/app` — incremental metadata will ' +
					'not be collected for prerendered paths.',
			);
		}
		return { value: await fn(), metadata: undefined };
	}
	const store: RenderCollectors = { contentEntries: new Set(), staticImages: [] };
	const value = await scope.run(store, fn);
	return {
		value,
		metadata: {
			contentEntryKeys: [...store.contentEntries!],
			staticImages: [...store.staticImages!],
		},
	};
}
