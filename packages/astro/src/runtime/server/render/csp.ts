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

	let directives;
	if (result.directives.length > 0) {
		directives = result.directives.join(';') + ';';
	}

	let scriptResources = "'self'";
	if (result.scriptResources.length > 0) {
		scriptResources = result.scriptResources.map((r) => `${r}`).join(' ');
	}

	let styleResources = "'self'";
	if (result.styleResources.length > 0) {
		styleResources = result.styleResources.map((r) => `${r}`).join(' ');
	}

	const strictDynamic = result.isStrictDynamic ? ` 'strict-dynamic'` : '';
	const scriptSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(' ')}${strictDynamic};`;

	// When unsafeInline is enabled for styles, skip emitting style hashes (per the CSP spec,
	// browsers ignore 'unsafe-inline' when hashes or nonces are present in the same directive).
	// Instead, emit 'unsafe-inline' explicitly so it remains effective.
	const styleSrc = result.isStyleUnsafeInline
		? `style-src ${styleResources} 'unsafe-inline';`
		: `style-src ${styleResources} ${Array.from(finalStyleHashes).join(' ')};`;
		
	return [directives, scriptSrc, styleSrc].filter(Boolean).join(' ');
}
