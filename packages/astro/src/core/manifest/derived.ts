import type { SSRManifest } from '../app/types.js';
import { createManifestMemo } from './memo.js';

const sites = createManifestMemo((manifest) =>
	manifest.site ? new URL(manifest.site) : undefined,
);

/** The manifest's `site` as a `URL` (used for `Astro.site`). */
export function getSite(manifest: SSRManifest): URL | undefined {
	return sites.get(manifest);
}
