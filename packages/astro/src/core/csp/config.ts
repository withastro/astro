import * as z from 'zod/v4';

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (
	arg: infer I,
) => void
	? I
	: never;

type UnionToTuple<T> =
	UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
		? [...UnionToTuple<Exclude<T, W>>, W]
		: [];

export const ALGORITHMS = {
	'SHA-256': 'sha256-',
	'SHA-384': 'sha384-',
	'SHA-512': 'sha512-',
} as const;

type Algorithms = typeof ALGORITHMS;

export type CspAlgorithm = keyof Algorithms;
type CspAlgorithmValue = Algorithms[keyof Algorithms];

const ALGORITHM_VALUES = Object.values(ALGORITHMS) as UnionToTuple<CspAlgorithmValue>;

export const cspAlgorithmSchema = z
	.enum(Object.keys(ALGORITHMS) as UnionToTuple<CspAlgorithm>)
	.optional()
	.default('SHA-256');

export const cspHashSchema = z.custom<`${CspAlgorithmValue}${string}`>((value) => {
	if (typeof value !== 'string') {
		return false;
	}
	return ALGORITHM_VALUES.some((allowedValue) => {
		return value.startsWith(allowedValue);
	});
});

export type CspHash = z.infer<typeof cspHashSchema>;

/**
 * The scope a resource or hash applies to:
 * - `default`: the generic `script-src`/`style-src` directive (default behavior).
 * - `element`: the `script-src-elem`/`style-src-elem` directive (`<script>`, `<style>`, `<link rel="stylesheet">`).
 * - `attribute`: the `script-src-attr`/`style-src-attr` directive (inline event handlers and inline `style` attributes).
 */
export const CSP_KINDS = ['element', 'attribute', 'default'] as const;
export type CspKind = (typeof CSP_KINDS)[number];

export const cspKindSchema = z.enum(CSP_KINDS);

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

// Per MDN, `script-src-attr`/`style-src-attr` only accept these keyword sources.
const ATTRIBUTE_ALLOWED_RESOURCES = [
	"'none'",
	"'unsafe-hashes'",
	"'unsafe-inline'",
	"'report-sample'",
] as const;

export const cspResourceEntrySchema = z
	.union([
		z.string(),
		z.object({
			resource: z.string(),
			kind: cspKindSchema,
		}),
	])
	.superRefine((value, ctx) => {
		// `value` is already a valid union member here, so a bare string is the `default` kind.
		const resource = typeof value === 'string' ? value : value.resource;
		const kind = typeof value === 'string' ? 'default' : value.kind;
		// `'unsafe-hashes'` is invalid on the `-elem` directives.
		if (kind === 'element' && resource === "'unsafe-hashes'") {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `The source \`'unsafe-hashes'\` is not valid for \`element\` resources (it is rejected by \`script-src-elem\`/\`style-src-elem\`).`,
				fatal: true,
			});
		} else if (
			kind === 'attribute' &&
			!(ATTRIBUTE_ALLOWED_RESOURCES as readonly string[]).includes(resource)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `The source \`${resource}\` is not valid for \`attribute\` resources. \`script-src-attr\`/\`style-src-attr\` only accept: ${ATTRIBUTE_ALLOWED_RESOURCES.join(', ')}.`,
				fatal: true,
			});
		}
	});

export const cspHashEntrySchema = z.union([
	cspHashSchema,
	z.object({
		hash: cspHashSchema,
		kind: cspKindSchema,
	}),
]);

const ALLOWED_DIRECTIVES = [
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

export const allowedDirectivesSchema = z
	.custom<CspDirective>((v) => typeof v === 'string')
	.superRefine((value, ctx) => {
		const isAllowed = ALLOWED_DIRECTIVES.some((allowedValue) => {
			return value.startsWith(allowedValue);
		});
		if (!isAllowed) {
			if (value.startsWith('script-src') || value.startsWith('style-src')) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Directives \`script-src\` and \`style-src\` (including their \`-elem\`/\`-attr\` variants) are not allowed in \`security.csp.directives\`. Please use \`security.csp.scriptDirective\` and \`security.csp.styleDirective\` instead, scoping resources/hashes to the more specific directives with the \`kind\` option (\`"element"\` or \`"attribute"\`).`,
					fatal: true,
				});
			} else {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid directive: "${value}". Allowed directives are: ${ALLOWED_DIRECTIVES.join(', ')}`,
					fatal: true,
				});
			}
		}
	});
