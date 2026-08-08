export const ASTRO_INCREMENTAL_META_KEY = 'astroIncremental';

interface AstroIncrementalMetadata {
	kind: 'content-data' | 'skip';
}

export function createContentDataIncrementalMetadata() {
	return {
		[ASTRO_INCREMENTAL_META_KEY]: {
			kind: 'content-data',
		},
	};
}

/**
 * Marks a module so that `collectTransitiveDeps` will exclude it (and its
 * subtree) from the dependency hash. Use this for virtual modules whose
 * generated code contains build-ephemeral values (e.g. a random port) that
 * would otherwise bust the incremental cache on every build.
 */
export function createSkipIncrementalMetadata() {
	return {
		[ASTRO_INCREMENTAL_META_KEY]: {
			kind: 'skip' as const,
		},
	};
}

export function isContentDataIncrementalModule(
	info: { meta?: Record<string, any> } | null | undefined,
): boolean {
	const metadata = info?.meta?.[ASTRO_INCREMENTAL_META_KEY] as AstroIncrementalMetadata | undefined;
	return metadata?.kind === 'content-data';
}

export function isSkippedIncrementalModule(
	info: { meta?: Record<string, any> } | null | undefined,
): boolean {
	const metadata = info?.meta?.[ASTRO_INCREMENTAL_META_KEY] as AstroIncrementalMetadata | undefined;
	return metadata?.kind === 'skip';
}
