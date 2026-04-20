// Detect the `"use astro:head-inject"` directive in source code.
// This directive marks a module as needing head propagation (CSS/script injection into <head>).
const HEAD_PROPAGATION_EXP = /"use astro:head-inject"/;

/**
 * Returns true when source contains the `"use astro:head-inject"` directive.
 */
export function hasHeadPropagationCall(source: string): boolean {
	return HEAD_PROPAGATION_EXP.test(source);
}
