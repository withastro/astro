export const ALGORITHMS = {
	'SHA-256': 'sha256-',
	'SHA-384': 'sha384-',
	'SHA-512': 'sha512-',
} as const;

type Algorithms = typeof ALGORITHMS;

export type CspAlgorithm = keyof Algorithms;
export type CspAlgorithmValue = Algorithms[keyof Algorithms];

export type CspHash = `${CspAlgorithmValue}${string}`;

/**
 * The scope a resource or hash applies to:
 * - `default`: the generic `script-src`/`style-src` directive (default behavior).
 * - `element`: the `script-src-elem`/`style-src-elem` directive (`<script>`, `<style>`, `<link rel="stylesheet">`).
 * - `attribute`: the `script-src-attr`/`style-src-attr` directive (inline event handlers and inline `style` attributes).
 */
export const CSP_KINDS = ['element', 'attribute', 'default'] as const;
export type CspKind = (typeof CSP_KINDS)[number];

/**
 * A `script-src`/`style-src` resource. A bare string targets `script-src`/`style-src` (the same as
 * `kind: 'default'`). Use the object form with an explicit `kind` to target a more specific directive.
 */
export type CspResourceEntry = string | { resource: string; kind: CspKind };

/**
 * A `script-src`/`style-src` hash. A bare hash (a string) targets `script-src`/`style-src` (the same as
 * `kind: 'default'`). Use the object form with an explicit `kind` to target a more specific directive.
 */
export type CspHashEntry = CspHash | { hash: CspHash; kind: CspKind };

export const ALLOWED_DIRECTIVES = [
	'base-uri',
	'child-src',
	'connect-src',
	'default-src',
	'fenced-frame-src',
	'font-src',
	'form-action',
	'frame-ancestors',
	'frame-src',
	'img-src',
	'manifest-src',
	'media-src',
	'object-src',
	'referrer',
	'report-to',
	'report-uri',
	'require-trusted-types-for',
	'sandbox',
	'trusted-types',
	'upgrade-insecure-requests',
	'worker-src',
] as const;
type AllowedDirectives = (typeof ALLOWED_DIRECTIVES)[number];
export type CspDirective = `${AllowedDirectives}${string | undefined}`;

export function normalizeCspResourceEntry(entry: CspResourceEntry): {
	resource: string;
	kind: CspKind;
} {
	if (typeof entry === 'string') {
		return { resource: entry, kind: 'default' };
	}
	return { resource: entry.resource, kind: entry.kind ?? 'default' };
}

export function normalizeCspHashEntry(entry: CspHashEntry): { hash: CspHash; kind: CspKind } {
	if (typeof entry === 'string') {
		return { hash: entry, kind: 'default' };
	}
	return { hash: entry.hash, kind: entry.kind ?? 'default' };
}

/** The resolved sources of a single CSP directive. */
export type CspDirectiveSources = { resources: string[]; hashes: string[] };

/**
 * Groups a directive's `resources`/`hashes` entries by their `kind`.
 */
export function partitionByKind(directive: {
	resources: CspResourceEntry[];
	hashes: CspHashEntry[];
}): Record<CspKind, CspDirectiveSources> {
	const groups: Record<CspKind, CspDirectiveSources> = {
		default: { resources: [], hashes: [] },
		element: { resources: [], hashes: [] },
		attribute: { resources: [], hashes: [] },
	};
	for (const entry of directive.resources) {
		const { resource, kind } = normalizeCspResourceEntry(entry);
		groups[kind].resources.push(resource);
	}
	for (const entry of directive.hashes) {
		const { hash, kind } = normalizeCspHashEntry(entry);
		groups[kind].hashes.push(hash);
	}
	return groups;
}
