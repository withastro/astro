import type { SSRResult } from '../../../types/public/index.js';

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
		for (const [ name, hash ] of Object.entries(result.astroIslandHashes)) {
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
