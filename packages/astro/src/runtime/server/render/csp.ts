import type { SSRResult } from '../../../types/public/index.js';

export function renderCspContent(result: SSRResult): string {
	const finalScriptHashes = new Set();
	const finalStyleHashes = new Set();

	for (const scriptHash of result.scriptHashes) {
		finalScriptHashes.add(`'${scriptHash}'`);
	}

	for (const styleHash of result.styleHashes) {
		finalStyleHashes.add(`'${styleHash}'`);
	}

	for (const styleHash of result._metadata.extraStyleHashes) {
		finalStyleHashes.add(`'${styleHash}'`);
	}

	for (const scriptHash of result._metadata.extraScriptHashes) {
		finalScriptHashes.add(`'${scriptHash}'`);
	}
	const directives = result.directives
		.map(({ type, value }) => {
			return `${type} ${value}`;
		})
		.join(';');

	let scriptResources = "'self'";
	if (result.scriptResources.length > 0) {
		scriptResources = result.scriptResources.map((r) => `'${r}'`).join(' ');
	}

	let styleResources = "'self'";
	if (result.styleResources.length > 0) {
		styleResources = result.styleResources.map((r) => `'${r}'`).join(' ');
	}

	const scriptSrc = `style-src ${styleResources} ${Array.from(finalStyleHashes).join(' ')};`;
	const styleSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(' ')};`;
	return `${directives} ${scriptSrc} ${styleSrc}`;
}
