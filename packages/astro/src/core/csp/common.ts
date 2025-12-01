import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import astroIslandPrebuilt from '../../runtime/server/astro-island.prebuilt.js';
import astroIslandPrebuiltDev from '../../runtime/server/astro-island.prebuilt-dev.js';
import { ISLAND_STYLES } from '../../runtime/server/astro-island-styles.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig, CspAlgorithm } from '../../types/public/index.js';
import type { BuildInternals } from '../build/internal.js';
import { generateCspDigest } from '../encryption.js';
import type { CspDirective } from './config.js';

type EnabledCsp = Exclude<AstroConfig['experimental']['csp'], false>;

export function shouldTrackCspHashes(csp: any): csp is EnabledCsp {
	return csp === true || typeof csp === 'object';
}

export function getAlgorithm(csp: EnabledCsp): CspAlgorithm {
	if (csp === true) {
		return 'SHA-256';
	}
	return csp.algorithm;
}

export function getScriptHashes(csp: EnabledCsp): string[] {
	if (csp === true) {
		return [];
	} else {
		return csp.scriptDirective?.hashes ?? [];
	}
}

export function getScriptResources(csp: EnabledCsp): string[] {
	if (csp === true) {
		return [];
	}
	return csp.scriptDirective?.resources ?? [];
}

export function getStyleHashes(csp: EnabledCsp): string[] {
	if (csp === true) {
		return [];
	}
	return csp.styleDirective?.hashes ?? [];
}

export function getStyleResources(csp: EnabledCsp): string[] {
	if (csp === true) {
		return [];
	}
	return csp.styleDirective?.resources ?? [];
}

// Unlike other helpers like getStyleResources, getDirectives has more logic
// because it has to collect and deduplicate font resources from both the user
// config and the vite plugin for fonts
export function getDirectives(settings: AstroSettings): CspDirective[] {
	const { csp } = settings.config.experimental;
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

export async function trackStyleHashes(
	internals: BuildInternals,
	settings: AstroSettings,
	algorithm: CspAlgorithm,
): Promise<string[]> {
	const clientStyleHashes: string[] = [];
	for (const [_, page] of internals.pagesByViteID.entries()) {
		for (const style of page.styles) {
			if (style.sheet.type === 'inline') {
				clientStyleHashes.push(await generateCspDigest(style.sheet.content, algorithm));
			}
		}
	}

	for (const clientAsset in internals.clientChunksAndAssets) {
		const contents = readFileSync(
			fileURLToPath(new URL(clientAsset, settings.config.build.client)),
			'utf-8',
		);
		if (clientAsset.endsWith('.css') || clientAsset.endsWith('.css')) {
			clientStyleHashes.push(await generateCspDigest(contents, algorithm));
		}
	}

	if (settings.renderers.length > 0) {
		clientStyleHashes.push(await generateCspDigest(ISLAND_STYLES, algorithm));
	}

	return clientStyleHashes;
}

export async function trackScriptHashes(
	internals: BuildInternals,
	settings: AstroSettings,
	algorithm: CspAlgorithm,
): Promise<string[]> {
	const clientScriptHashes: string[] = [];

	for (const script of internals.inlinedScripts.values()) {
		clientScriptHashes.push(await generateCspDigest(script, algorithm));
	}

	for (const directiveContent of Array.from(settings.clientDirectives.values())) {
		clientScriptHashes.push(await generateCspDigest(directiveContent, algorithm));
	}

	for (const clientAsset in internals.clientChunksAndAssets) {
		const contents = readFileSync(
			fileURLToPath(new URL(clientAsset, settings.config.build.client)),
			'utf-8',
		);
		if (clientAsset.endsWith('.js') || clientAsset.endsWith('.mjs')) {
			clientScriptHashes.push(await generateCspDigest(contents, algorithm));
		}
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
