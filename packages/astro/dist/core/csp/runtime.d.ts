import type { SSRManifestCSP } from '../app/types.js';
import type { CspDirective } from './config.js';
/**
 * `existingDirective` is something like `img-src 'self'`. Same as `newDirective`.
 *
 * Returns `undefined` if no directive has been deduped
 * @param existingDirective
 * @param newDirective
 */
export declare function deduplicateDirectiveValues(
	existingDirective: CspDirective,
	newDirective: CspDirective,
): CspDirective | undefined;
export declare function pushDirective(
	directives: SSRManifestCSP['directives'],
	newDirective: CspDirective,
): SSRManifestCSP['directives'];
