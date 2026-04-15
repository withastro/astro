// Detect `$$result._astro_head_inject` in source, both in .astro components and in js/ts files.
// Keep behavior aligned with the existing plugin usage.
const HEAD_PROPAGATION_CALL_EXP = /\$\$result._astro_head_inject/;

/**
 * Returns true when source contains the `$$result._astro_head_inject` marker.
 *
 * @example
 * `$$result._astro_head_inject` in a component marks parent importers as `in-tree`.
 */
export function hasHeadPropagationCall(source: string): boolean {
	return HEAD_PROPAGATION_CALL_EXP.test(source);
}
