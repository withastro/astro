import {
	ALGORITHMS,
	ALLOWED_DIRECTIVES,
	CSP_KINDS,
	type CspAlgorithm,
	type CspAlgorithmValue,
	type CspDirective,
	type CspHash,
	type CspHashEntry,
	type CspKind,
	type CspResourceEntry,
} from '@astrojs/runtime/internal/core/csp/sources.js';
import * as z from 'zod/v4';

export {
	ALGORITHMS,
	CSP_KINDS,
	type CspAlgorithm,
	type CspDirective,
	type CspHash,
	type CspHashEntry,
	type CspKind,
	type CspResourceEntry,
};

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (
	arg: infer I,
) => void
	? I
	: never;

type UnionToTuple<T> =
	UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
		? [...UnionToTuple<Exclude<T, W>>, W]
		: [];

const ALGORITHM_VALUES = Object.values(ALGORITHMS) as UnionToTuple<CspAlgorithmValue>;

export const cspAlgorithmSchema = z
	.enum(Object.keys(ALGORITHMS) as UnionToTuple<CspAlgorithm>)
	.optional()
	.default('SHA-256');

export const cspHashSchema = z.custom<CspHash>((value) => {
	if (typeof value !== 'string') {
		return false;
	}
	return ALGORITHM_VALUES.some((allowedValue) => {
		return value.startsWith(allowedValue);
	});
});

export const cspKindSchema = z.enum(CSP_KINDS);

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
