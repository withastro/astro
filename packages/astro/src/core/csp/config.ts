import { z } from 'zod';

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (
	arg: infer I,
) => void
	? I
	: never;

type UnionToTuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (
	_: never,
) => infer W
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

export const allowedDirectivesSchema = z.custom<CspDirective>((value) => {
	if (typeof value !== 'string') {
		return false;
	}
	return ALLOWED_DIRECTIVES.some((allowedValue) => {
		return value.startsWith(allowedValue);
	});
});
