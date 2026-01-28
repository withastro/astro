import type { SSRManifestCSP } from '../app/types.js';
import type { CspDirective } from './config.js';

/**
 * `existingDirective` is something like `img-src 'self'`. Same as `newDirective`.
 *
 * Returns `undefined` if no directive has been deduped
 * @param existingDirective
 * @param newDirective
 */
export function deduplicateDirectiveValues(
	existingDirective: CspDirective,
	newDirective: CspDirective,
): CspDirective | undefined {
	const [directiveName, ...existingValues] = existingDirective
		// split spaces
		.split(/\s+/)
		// Avoid duplicated spaces
		.filter(Boolean);
	const [newDirectiveName, ...newValues] = newDirective
		// split spaces
		.split(/\s+/)
		// Avoid duplicated spaces
		.filter(Boolean);
	if (directiveName !== newDirectiveName) {
		return undefined;
	}
	const finalDirectives = Array.from(new Set([...existingValues, ...newValues]));

	return `${directiveName} ${finalDirectives.join(' ')}` as CspDirective;
}

export function pushDirective(
	directives: SSRManifestCSP['directives'],
	newDirective: CspDirective,
): SSRManifestCSP['directives'] {
	let deduplicated = false;
	if (directives.length === 0) {
		return [newDirective];
	}
	const finalDirectives: SSRManifestCSP['directives'] = [];
	for (const directive of directives) {
		if (deduplicated) {
			finalDirectives.push(directive);
			continue;
		}
		const result = deduplicateDirectiveValues(directive, newDirective);
		if (result) {
			finalDirectives.push(result);
			deduplicated = true;
		} else {
			finalDirectives.push(directive);
			finalDirectives.push(newDirective);
		}
	}
	return finalDirectives;
}
