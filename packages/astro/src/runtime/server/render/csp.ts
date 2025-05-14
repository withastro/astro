import type { SSRResult } from '../../../types/public/index.js';

export function renderCspContent(result: SSRResult): string {
	const finalScriptHashes = new Set();
	const finalStyleHashes = new Set();

	for (const scriptHash of result.clientScriptHashes) {
		finalScriptHashes.add(`'${scriptHash}'`);
	}

	for (const styleHash of result.clientStyleHashes) {
		finalStyleHashes.add(`'${styleHash}'`);
	}

	for (const styleHash of result._metadata.extraStyleHashes) {
		finalStyleHashes.add(`'${styleHash}'`);
	}

	for (const scriptHash of result._metadata.extraScriptHashes) {
		finalScriptHashes.add(`'${scriptHash}'`);
	}

	const scriptSrc = `style-src 'self' ${Array.from(finalStyleHashes).join(' ')};`;
	const styleSrc = `script-src 'self' ${Array.from(finalScriptHashes).join(' ')};`;
	return `${scriptSrc} ${styleSrc}`;
}
