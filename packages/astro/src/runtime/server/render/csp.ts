import type { SSRResult } from '../../../types/public/index.js';

export function renderCspContent(result: SSRResult): string {
	const finalScriptHashes = new Set();
	const finalStyleHashes = new Set();

	for (const scriptHash of result.scriptHashes) {
		finalScriptHashes.add(`'${scriptHash}'`);
	}

	if (!result.styleUnsafeInline) {
		for (const styleHash of result.styleHashes) {
			finalStyleHashes.add(`'${styleHash}'`);
		}

		for (const styleHash of result._metadata.extraStyleHashes) {
			finalStyleHashes.add(`'${styleHash}'`);
		}
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
	if (result.styleUnsafeInline) {
		// When unsafeInline is set, add 'unsafe-inline' and skip hashes
		// Per CSP spec, browsers ignore 'unsafe-inline' when hashes are present
		if (result.styleResources.length > 0) {
			const resources = result.styleResources.filter((r) => r !== "'unsafe-inline'");
			styleResources = ["'unsafe-inline'", ...resources].join(' ');
		} else {
			styleResources = "'self' 'unsafe-inline'";
		}
	} else if (result.styleResources.length > 0) {
		styleResources = result.styleResources.map((r) => `${r}`).join(' ');
	}

	const strictDynamic = result.isStrictDynamic ? ` 'strict-dynamic'` : '';
	const scriptSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(' ')}${strictDynamic};`;
	const styleHashesSuffix =
		finalStyleHashes.size > 0 ? ` ${Array.from(finalStyleHashes).join(' ')}` : '';
	const styleSrc = `style-src ${styleResources}${styleHashesSuffix};`;
	return [directives, scriptSrc, styleSrc].filter(Boolean).join(' ');
}
