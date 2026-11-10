import type { SSRManifest } from '../../internal/core/app/types.js';
import { createManifestMemo } from '../../internal/core/manifest/memo.js';

const sites = createManifestMemo((manifest) =>
	manifest.site ? new URL(manifest.site) : undefined,
);

/** The manifest's `site` as a `URL` (used for `Astro.site`). */
export function getSite(manifest: SSRManifest): URL | undefined {
	return sites.get(manifest);
}
