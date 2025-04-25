import type { AstroConfig, SSRResult } from '../../types/public/index.js';
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

export function renderCspContent(result: SSRResult): string {
	const finalScriptHashes = new Set();
	const finalStyleHashes = new Set();

	for (const scriptHash of result.clientScriptHashes) {
		finalScriptHashes.add(`'sha256-${scriptHash}'`);
	}

	for (const styleHash of result.clientStyleHashes) {
		finalStyleHashes.add(`'sha256-${styleHash}'`);
	}

	if (result.renderers.length > 0) {
		for (const { name, hash } of result.astroIslandHashes) {
			if (name === 'astro-island-styles') {
				finalStyleHashes.add(`'sha256-${hash}'`);
			} else {
				finalScriptHashes.add(`'sha256-${hash}'`);
			}
		}
	}

	const scriptSrc = `style-src 'self' ${Array.from(finalStyleHashes).join(' ')};`;
	const styleSrc = `script-src 'self' ${Array.from(finalScriptHashes).join(' ')};`;
	return `${scriptSrc} ${styleSrc}`;
}
