import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ISLAND_STYLES } from '../../runtime/server/astro-island-styles.js';
import astroIslandPrebuiltDev from '../../runtime/server/astro-island.prebuilt-dev.js';
import astroIslandPrebuilt from '../../runtime/server/astro-island.prebuilt.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { BuildInternals } from '../build/internal.js';
import { generateDigest } from '../encryption.js';

export function shouldTrackCspHashes(config: AstroConfig): boolean {
	return config.experimental?.csp === true;
}

export async function trackStyleHashes(
	internals: BuildInternals,
	settings: AstroSettings,
): Promise<string[]> {
	const clientStyleHashes: string[] = [];
	for (const [_, page] of internals.pagesByViteID.entries()) {
		for (const style of page.styles) {
			if (style.sheet.type === 'inline') {
				clientStyleHashes.push(await generateDigest(style.sheet.content));
			}
		}
	}

	for (const clientAsset in internals.clientChunksAndAssets) {
		const contents = readFileSync(
			fileURLToPath(new URL(clientAsset, settings.config.build.client)),
			'utf-8',
		);
		if (clientAsset.endsWith('.css') || clientAsset.endsWith('.css')) {
			clientStyleHashes.push(await generateDigest(contents));
		}
	}

	if (settings.renderers.length > 0) {
		clientStyleHashes.push(await generateDigest(ISLAND_STYLES));
	}

	return clientStyleHashes;
}

export async function trackScriptHashes(
	internals: BuildInternals,
	settings: AstroSettings,
): Promise<string[]> {
	const clientScriptHashes: string[] = [];

	for (const script of internals.inlinedScripts.values()) {
		clientScriptHashes.push(await generateDigest(script));
	}

	for (const directiveContent of Array.from(settings.clientDirectives.values())) {
		clientScriptHashes.push(await generateDigest(directiveContent));
	}

	for (const clientAsset in internals.clientChunksAndAssets) {
		const contents = readFileSync(
			fileURLToPath(new URL(clientAsset, settings.config.build.client)),
			'utf-8',
		);
		if (clientAsset.endsWith('.js') || clientAsset.endsWith('.mjs')) {
			clientScriptHashes.push(await generateDigest(contents));
		}
	}

	for (const script of settings.scripts) {
		const { content, stage } = script;
		if (stage === 'head-inline' || stage === 'before-hydration') {
			clientScriptHashes.push(await generateDigest(content));
		}
	}

	if (settings.renderers.length > 0) {
		clientScriptHashes.push(await generateDigest(astroIslandPrebuilt));
		clientScriptHashes.push(await generateDigest(astroIslandPrebuiltDev));
	}

	return clientScriptHashes;
}
