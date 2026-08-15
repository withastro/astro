import { NoManifestAvailable } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import type { SSRManifest } from '../app/types.js';
// Static import; the binding is READ LAZILY inside the functions below so this
// module stays TDZ-safe under any future accidental import cycle. In every
// Vite-processed server environment the serialized-manifest plugin resolves the
// specifier to `virtual:astro:manifest`; in plain Node the package.json
// `imports` field resolves it to the `undefined` stub in `ambient-source.ts`.
import { manifest as viteManifest } from '#astro-internal/ambient-manifest';

// Anti-god-object clamp: this module exports exactly `setAmbientManifest`,
// `getAmbientManifest`, `tryGetAmbientManifest` and holds exactly one piece of
// state (the registered manifest). It may never hold derived data, caches,
// environment records, or a logger — derived state lives in the owning
// module's manifest-keyed WeakMap.
let registered: SSRManifest | undefined;

/**
 * Registers a manifest for environments where `virtual:astro:manifest` cannot
 * resolve (plain Node: unit tests, embedders). Internal API — deliberately not
 * exported from any public entrypoint.
 * Pass `undefined` to clear (test teardown).
 */
export function setAmbientManifest(manifest: SSRManifest | undefined): void {
	registered = manifest;
}

/**
 * The ambient manifest: the explicitly registered one, else the virtual
 * module's. Throws lazily when neither is available, so merely importing a
 * module that uses this never fails — only actually handling a request does.
 */
export function getAmbientManifest(): SSRManifest {
	const manifest = registered ?? viteManifest;
	if (!manifest) {
		throw new AstroError(NoManifestAvailable);
	}
	return manifest;
}

/** The ambient manifest if one is available, else `undefined`. Never throws. */
export function tryGetAmbientManifest(): SSRManifest | undefined {
	return registered ?? viteManifest;
}
