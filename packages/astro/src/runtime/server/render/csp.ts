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

	let directives = '';
	if (result.directives.length > 0) {
		directives = result.directives.join(';') + ';';
	}

	let scriptResources = "'self'";
	if (result.scriptResources.length > 0) {
		scriptResources = [...new Set(result.scriptResources)].join(' ');
	}

	let styleResources = "'self'";
	if (result.styleResources.length > 0) {
		styleResources = [...new Set(result.styleResources)].join(' ');
	}
	let fontResources = "'self'";
	if (result.fontResources.length > 0) {
		fontResources = [...new Set(result.fontResources)].join(' ');
	}

	const strictDynamic = result.isStrictDynamic ? ` 'strict-dynamic'` : '';
	const scriptSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(' ')}${strictDynamic};`;
	const styleSrc = `style-src ${styleResources} ${Array.from(finalStyleHashes).join(' ')};`;
	const fontSrc = `font-src ${fontResources};`;
	return `${directives} ${scriptSrc} ${styleSrc} ${fontSrc}`;
}
