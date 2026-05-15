import * as z from 'zod/v4';
export declare const ALGORITHMS: {
	readonly 'SHA-256': 'sha256-';
	readonly 'SHA-384': 'sha384-';
	readonly 'SHA-512': 'sha512-';
};
type Algorithms = typeof ALGORITHMS;
export type CspAlgorithm = keyof Algorithms;
export declare const cspAlgorithmSchema: z.ZodDefault<
	z.ZodOptional<
		z.ZodEnum<{
			'SHA-256': 'SHA-256';
			'SHA-384': 'SHA-384';
			'SHA-512': 'SHA-512';
		}>
	>
>;
export declare const cspHashSchema: z.ZodCustom<
	`sha256-${string}` | `sha384-${string}` | `sha512-${string}`,
	`sha256-${string}` | `sha384-${string}` | `sha512-${string}`
>;
export type CspHash = z.infer<typeof cspHashSchema>;
declare const ALLOWED_DIRECTIVES: readonly [
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
];
type AllowedDirectives = (typeof ALLOWED_DIRECTIVES)[number];
export type CspDirective = `${AllowedDirectives}${string | undefined}`;
export declare const allowedDirectivesSchema: z.ZodCustom<
	| `base-uri${string}`
	| `child-src${string}`
	| `connect-src${string}`
	| `default-src${string}`
	| `fenced-frame-src${string}`
	| `font-src${string}`
	| `form-action${string}`
	| `frame-ancestors${string}`
	| `frame-src${string}`
	| `img-src${string}`
	| `manifest-src${string}`
	| `media-src${string}`
	| `object-src${string}`
	| `referrer${string}`
	| `report-to${string}`
	| `report-uri${string}`
	| `require-trusted-types-for${string}`
	| `sandbox${string}`
	| `trusted-types${string}`
	| `upgrade-insecure-requests${string}`
	| `worker-src${string}`,
	| `base-uri${string}`
	| `child-src${string}`
	| `connect-src${string}`
	| `default-src${string}`
	| `fenced-frame-src${string}`
	| `font-src${string}`
	| `form-action${string}`
	| `frame-ancestors${string}`
	| `frame-src${string}`
	| `img-src${string}`
	| `manifest-src${string}`
	| `media-src${string}`
	| `object-src${string}`
	| `referrer${string}`
	| `report-to${string}`
	| `report-uri${string}`
	| `require-trusted-types-for${string}`
	| `sandbox${string}`
	| `trusted-types${string}`
	| `upgrade-insecure-requests${string}`
	| `worker-src${string}`
>;
export {};
