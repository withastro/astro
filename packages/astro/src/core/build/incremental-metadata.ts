export const ASTRO_INCREMENTAL_META_KEY = 'astroIncremental';

interface AstroIncrementalMetadata {
	kind: 'content-data';
}

export function createContentDataIncrementalMetadata() {
	return {
		[ASTRO_INCREMENTAL_META_KEY]: {
			kind: 'content-data',
		},
	};
}

export function isContentDataIncrementalModule(
	info: { meta?: Record<string, any> } | null | undefined,
): boolean {
	const metadata = info?.meta?.[ASTRO_INCREMENTAL_META_KEY] as AstroIncrementalMetadata | undefined;
	return metadata?.kind === 'content-data';
}
