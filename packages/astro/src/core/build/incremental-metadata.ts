export const ASTRO_INCREMENTAL_META_KEY = 'astroIncremental';

interface AstroIncrementalMetadata {
	kind: 'content-data' | 'volatile';
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

/**
 * Marks a module whose code differs between two otherwise identical builds — for
 * example because it embeds the address of a server that listens on an ephemeral
 * port. Such a module must not take part in a route's dependency hash: it says
 * nothing about whether the rendered output would change, and including it makes
 * every route look modified on every build.
 */
export function createVolatileIncrementalMetadata() {
	return {
		[ASTRO_INCREMENTAL_META_KEY]: {
			kind: 'volatile',
		},
	};
}

export function isVolatileIncrementalModule(
	info: { meta?: Record<string, any> } | null | undefined,
): boolean {
	const metadata = info?.meta?.[ASTRO_INCREMENTAL_META_KEY] as AstroIncrementalMetadata | undefined;
	return metadata?.kind === 'volatile';
}
