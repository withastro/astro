import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import astroIslandPrebuilt from '@astrojs/runtime/_internal/server/astro-island.prebuilt.js';
import astroIslandPrebuiltDev from '@astrojs/runtime/_internal/server/astro-island.prebuilt-dev.js';
import { ISLAND_STYLES } from '@astrojs/runtime/_internal/server/astro-island-styles.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig, CspAlgorithm } from '../../types/public/index.js';
import type { BuildInternals } from '../build/internal.js';
import { createAssetLink } from '../render/ssr-element.js';
import { generateCspDigest } from '@astrojs/runtime/_internal/core/encryption.js';
import type { CspDirective, CspHash, CspHashEntry, CspResourceEntry } from './config.js';

type EnabledCsp = Exclude<AstroConfig['security']['csp'], false>;

export function shouldTrackCspHashes(csp: any): csp is EnabledCsp {
	return csp === true || typeof csp === 'object';
}

export function getAlgorithm(csp: EnabledCsp): CspAlgorithm {
	if (csp === true) {
		return 'SHA-256';
	}
	return csp.algorithm;
}

export function getScriptResources(csp: EnabledCsp): CspResourceEntry[] {
	if (csp === true) {
		return [];
	}
	return csp.scriptDirective?.resources ?? [];
}

export function getScriptHashes(csp: EnabledCsp): CspHashEntry[] {
	if (csp === true) {
		return [];
	}
	return csp.scriptDirective?.hashes ?? [];
}

export function getStyleResources(csp: EnabledCsp): CspResourceEntry[] {
	if (csp === true) {
		return [];
	}
	return csp.styleDirective?.resources ?? [];
}

export function getStyleHashes(csp: EnabledCsp): CspHashEntry[] {
	if (csp === true) {
		return [];
	}
	return csp.styleDirective?.hashes ?? [];
}

// Unlike other helpers like getStyleResources, getDirectives has more logic
// because it has to collect and deduplicate font resources from both the user
// config and the vite plugin for fonts
export function getDirectives(settings: AstroSettings): CspDirective[] {
	const { csp } = settings.config.security;
	if (!shouldTrackCspHashes(csp)) {
		return [];
	}
	const userDirectives = csp === true ? [] : [...(csp.directives ?? [])];
	const fontResources = Array.from(settings.injectedCsp.fontResources.values());

	if (fontResources.length === 0) {
		// If no font resources, just return user directives
		return userDirectives;
	}

	const fontSrcIndex = userDirectives.findIndex((e) => e.startsWith('font-src'));
	if (fontSrcIndex === -1) {
		// Add new font-src directive
		return [...userDirectives, `font-src ${fontResources.join(' ')}`];
	}

	// Merge and deduplicate font-src resources
	const existing = userDirectives[fontSrcIndex]
		// split spaces
		.split(/\s+/)
		// ignore first match as it's the directive name
		.slice(1)
		// Avoid duplicated spaces
		.filter(Boolean);
	const merged = Array.from(new Set([...existing, ...fontResources]));
	userDirectives[fontSrcIndex] = `font-src ${merged.join(' ')}`;
	return userDirectives;
}

export function getStrictDynamic(csp: EnabledCsp): boolean {
	if (csp === true) {
		return false;
	}
	return csp.scriptDirective?.strictDynamic ?? false;
}

interface TrackCspHashesOptions {
	internals: BuildInternals;
	settings: AstroSettings;
	algorithm: CspAlgorithm;
}

export async function trackStyleHashes({
	internals,
	settings,
	algorithm,
}: TrackCspHashesOptions): Promise<CspHash[]> {
	const clientStyleHashes: CspHash[] = [];
	for (const [_, page] of internals.pagesByViteID.entries()) {
		for (const style of page.styles) {
			if (style.sheet.type === 'inline') {
				clientStyleHashes.push(await generateCspDigest(style.sheet.content, algorithm));
			}
		}
	}

	if (settings.renderers.length > 0) {
		clientStyleHashes.push(await generateCspDigest(ISLAND_STYLES, algorithm));
	}

	return clientStyleHashes;
}

export async function trackScriptHashes({
	internals,
	settings,
	algorithm,
}: TrackCspHashesOptions): Promise<CspHash[]> {
	const clientScriptHashes: CspHash[] = [];

	for (const script of internals.inlinedScripts.values()) {
		clientScriptHashes.push(await generateCspDigest(script, algorithm));
	}

	for (const directiveContent of Array.from(settings.clientDirectives.values())) {
		clientScriptHashes.push(await generateCspDigest(directiveContent, algorithm));
	}

	for (const script of settings.scripts) {
		const { content, stage } = script;
		if (stage === 'head-inline' || stage === 'before-hydration') {
			clientScriptHashes.push(await generateCspDigest(content, algorithm));
		}
	}

	if (settings.renderers.length > 0) {
		clientScriptHashes.push(await generateCspDigest(astroIslandPrebuilt, algorithm));
		clientScriptHashes.push(await generateCspDigest(astroIslandPrebuiltDev, algorithm));
	}

	return clientScriptHashes;
}

interface TrackScriptIntegrityOptions {
	settings: AstroSettings;
	algorithm: CspAlgorithm;
	clientRoot: URL;
	/** Paths of the files in the client output directory, relative to `clientRoot`. */
	clientFiles: Iterable<string>;
	/** Query string the adapter appends to rendered asset URLs (`assetQueryParams`). */
	assetQueryString?: string;
}

interface ScriptIntegrity {
	/** JSON content of a `<script type="importmap">` whose `integrity` map covers every client script. */
	importMapContent: string;
	/** Hashes of every client script and of the import map itself, for `script-src`. */
	hashes: CspHash[];
}

/**
 * Hashes every JavaScript file Astro emitted under `build.assets` in the client output.
 *
 * Under `'strict-dynamic'`, browsers ignore `'self'`, so module scripts (`<script src>`, the chunks
 * they import, and the `import()` calls of islands) load only when their hash is in `script-src` and
 * the browser has integrity metadata for the request. An import map `integrity` entry provides that
 * metadata for every module request, including the root `<script src>`.
 *
 * Returns `undefined` when the client output has no scripts.
 */
export async function trackScriptIntegrity({
	settings,
	algorithm,
	clientRoot,
	clientFiles,
	assetQueryString,
}: TrackScriptIntegrityOptions): Promise<ScriptIntegrity | undefined> {
	const assetsDir = `${settings.config.build.assets}/`;
	const scripts = Array.from(clientFiles)
		.filter((file) => file.startsWith(assetsDir) && (file.endsWith('.js') || file.endsWith('.mjs')))
		.sort();
	if (scripts.length === 0) {
		return undefined;
	}

	const integrity: Record<string, string> = {};
	const hashes: CspHash[] = [];
	for (const file of scripts) {
		const contents = readFileSync(fileURLToPath(new URL(file, clientRoot)), 'utf-8');
		const hash = await generateCspDigest(contents, algorithm);
		const url = createAssetLink(file, settings.config.base, settings.config.build.assetsPrefix);
		integrity[url] = hash;
		// Import map keys match exact URLs. Rendered tags carry the adapter's query string, while
		// chunks imported by other chunks are requested without it.
		if (assetQueryString) {
			integrity[`${url}?${assetQueryString}`] = hash;
		}
		hashes.push(hash);
	}

	const importMapContent = JSON.stringify({ integrity });
	hashes.push(await generateCspDigest(importMapContent, algorithm));
	return { importMapContent, hashes };
}
