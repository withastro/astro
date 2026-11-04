import {
	getInstalledRenderScope,
	type RenderCollectorScope,
	type RenderCollectors,
	type StaticImageRecord,
} from './scope.js';

export interface CollectedPrerenderMetadata<TImage extends StaticImageRecord = StaticImageRecord> {
	contentEntryKeys: string[];
	staticImages: TImage[];
	referencedImages: string[];
}

export interface CollectPrerenderMetadataOptions {
	/** Resolve build-time image URLs and collect them for generation. Default `true`. */
	staticImages?: boolean;
}

let warnedNoScope = false;

/**
 * Runs `fn` inside a fresh per-render collectors store and returns its value
 * together with a snapshot of everything recorded while it ran.
 *
 * When no render scope is installed, collection degrades to *not collecting*:
 * warn once per process (when a `logger` is given), run `fn` bare, and return
 * `metadata: undefined` ("not tracked") — never wrong attribution.
 *
 * Invariant: `fn` must not resolve until all recordable work is done — in
 * practice, until the response body is fully buffered inside `fn`. The
 * snapshot is taken by copy when `fn` resolves, so a late-arriving record (a
 * floating promise carrying the async context past buffering) mutates only the
 * abandoned store, never the returned metadata.
 */
export async function collectPrerenderMetadata<
	T,
	TImage extends StaticImageRecord = StaticImageRecord,
>(
	fn: () => Promise<T>,
	logger?: { warn(label: 'build', message: string): void },
	options: CollectPrerenderMetadataOptions = {},
): Promise<{ value: T; metadata: CollectedPrerenderMetadata<TImage> | undefined }> {
	const scope = getInstalledRenderScope();
	if (!scope) {
		if (logger && !warnedNoScope) {
			warnedNoScope = true;
			logger.warn(
				'build',
				'A prerenderer collected metadata but no render scope is installed; ' +
					'install one with `installRenderScope` from `astro/app` — optimized images and ' +
					'incremental metadata will not be collected for prerendered paths.',
			);
		}
		return { value: await fn(), metadata: undefined };
	}
	const store: RenderCollectors<TImage> = {
		contentEntries: new Set(),
		staticImages: options.staticImages === false ? undefined : [],
		referencedImages: new Set(),
	};
	const value = await (scope as RenderCollectorScope<TImage>).run(store, fn);
	return {
		value,
		metadata: {
			contentEntryKeys: [...store.contentEntries!],
			staticImages: [
				...new Map(
					store.staticImages?.map((image) => [`${image.originalPath}\0${image.hash}`, image]),
				).values(),
			],
			referencedImages: [...store.referencedImages!],
		},
	};
}
