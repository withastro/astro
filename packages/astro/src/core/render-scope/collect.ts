import type { SerializedStaticImage } from '../../assets/types.js';
import type { AstroLogger } from '../logger/core.js';
import { getInstalledRenderScope, hasRenderChannel, type RenderCollectors } from './scope.js';

export interface CollectedPrerenderMetadata {
	contentEntryKeys: string[];
	staticImages: SerializedStaticImage[];
	referencedImages: string[];
}

let warnedNoScope = false;

/** Runs `fn` in a fresh per-render store; `fn` must not resolve before all recordable work is done. */
export async function collectPrerenderMetadata<T>(
	fn: () => Promise<T>,
	logger: AstroLogger,
): Promise<{ value: T; metadata: CollectedPrerenderMetadata | undefined }> {
	const scope = getInstalledRenderScope();
	if (!scope) {
		// A channel without a scope was installed on purpose, by a runtime that warns on its own.
		if (!warnedNoScope && !hasRenderChannel()) {
			warnedNoScope = true;
			logger.warn(
				'build',
				'No render scope is installed, so prerendered pages cannot report the images and ' +
					'content entries they use. Install one with `installRenderScope` from `astro/app`.',
			);
		}
		return { value: await fn(), metadata: undefined };
	}
	const store: RenderCollectors = {
		contentEntries: new Set(),
		staticImages: [],
		referencedImages: new Set(),
	};
	const value = await scope.run(store, fn);
	return {
		value,
		metadata: {
			contentEntryKeys: [...store.contentEntries!],
			staticImages: dedupeStaticImages(store.staticImages!),
			referencedImages: [...store.referencedImages!],
		},
	};
}

function dedupeStaticImages(images: SerializedStaticImage[]): SerializedStaticImage[] {
	const seen = new Set<string>();
	return images.filter((image) => {
		const key = `${image.originalPath}\0${image.hash}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
