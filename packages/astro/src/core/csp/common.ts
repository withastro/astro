import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ISLAND_STYLES } from '../../runtime/server/astro-island-styles.js';
import astroIslandPrebuiltDev from '../../runtime/server/astro-island.prebuilt-dev.js';
import astroIslandPrebuilt from '../../runtime/server/astro-island.prebuilt.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig, CspAlgorithm } from '../../types/public/index.js';
import type { BuildInternals } from '../build/internal.js';
import { generateCspDigest } from '../encryption.js';

export function shouldTrackCspHashes(config: AstroConfig): boolean {
	return config.experimental?.csp === true || typeof config.experimental?.csp === 'object';
}

/**
 * Use this function when after you checked that CSP is enabled, or it throws an error.
 * @param config
 */
export function getAlgorithm(config: AstroConfig): CspAlgorithm {
	if (!config.experimental?.csp) {
		throw new Error('CSP is not enabled');
	}
	if (config.experimental?.csp === true) {
		return 'SHA-256';
	} else {
		return config.experimental.csp.algorithm;
	}
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
