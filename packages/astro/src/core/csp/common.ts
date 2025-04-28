import type { AstroConfig } from '../../types/public/index.js';
import type { BuildInternals } from '../build/internal.js';
import crypto from 'node:crypto';
import type { AstroSettings } from '../../types/astro.js';

export function shouldTrackCspHashes(config: AstroConfig): boolean {
	return config.experimental?.csp === true;
}

export function trackStyleHashes(internals: BuildInternals): string[] {
	const clientStyleHashes: string[] = [];
	for (const [_, page] of internals.pagesByViteID.entries()) {
		for (const style of page.styles) {
			if (style.sheet.type === 'inline') {
				clientStyleHashes.push(generateHash(style.sheet.content));
			}
		}
	}

	return clientStyleHashes;
}

export function trackScriptHashes(internals: BuildInternals, settings: AstroSettings): string[] {
	const clientScriptHashes: string[] = [];

	for (const script of internals.inlinedScripts.values()) {
		clientScriptHashes.push(generateHash(script));
	}

	for (const script of settings.scripts) {
		const { content, stage } = script;
		if (stage === 'head-inline' || stage === 'before-hydration') {
			clientScriptHashes.push(generateHash(content));
		}
	}

	return clientScriptHashes;
}

function generateHash(content: string): string {
	return crypto.createHash('sha256').update(content).digest('base64');
}
