import type { SSRResult } from '../../../types/public/index.js';

// Merge multiple hash sources into a single set, wrapping each in single quotes
// as required by the CSP spec (e.g. 'sha256-abc123').
function collectHashes(hashSources: Iterable<string>[]): Set<string> {
	const hashes = new Set<string>();
	for (const source of hashSources) {
		for (const hash of source) {
			hashes.add(`'${hash}'`);
		}
	}
	return hashes;
}

// Assemble a single CSP directive string, e.g. "script-src 'self' 'sha256-…' 'strict-dynamic';"
function buildDirective(
	name: string,
	resources: string[],
	hashes: Set<string>,
	suffix?: string,
): string {
	// Fall back to 'self' when no explicit resources are provided
	const resourcesPart = resources.length > 0 ? resources.join(' ') : "'self'";
	const hashesPart = Array.from(hashes).join(' ');
	const suffixPart = suffix ?? '';
	return `${name} ${resourcesPart} ${hashesPart}${suffixPart};`;
}

// Build the full Content-Security-Policy string from the collected hashes,
// resources, and user-defined directives on the SSRResult.
export function renderCspContent(result: SSRResult): string {
	const scriptHashes = collectHashes([result.scriptHashes, result._metadata.extraScriptHashes]);
	const styleHashes = collectHashes([result.styleHashes, result._metadata.extraStyleHashes]);

	const parts: string[] = [];

	// Prepend any user-defined directives (e.g. img-src, font-src) before the
	// auto-generated script-src / style-src directives.
	if (result.directives.length > 0) {
		parts.push(result.directives.join(';') + ';');
	}

	const strictDynamic = result.isStrictDynamic ? " 'strict-dynamic'" : '';
	parts.push(buildDirective('script-src', result.scriptResources, scriptHashes, strictDynamic));
	parts.push(buildDirective('style-src', result.styleResources, styleHashes));

	// CSP Level 3: script-src-elem inherits auto-generated script hashes
	if (result.scriptElemHashes.length > 0 || result.scriptElemResources.length > 0) {
		const elemHashes = collectHashes([scriptHashes, result.scriptElemHashes]);
		parts.push(buildDirective('script-src-elem', result.scriptElemResources, elemHashes));
	}

	// CSP Level 3: style-src-elem inherits auto-generated style hashes
	if (result.styleElemHashes.length > 0 || result.styleElemResources.length > 0) {
		const elemHashes = collectHashes([styleHashes, result.styleElemHashes]);
		parts.push(buildDirective('style-src-elem', result.styleElemResources, elemHashes));
	}

	return parts.join(' ');
}
