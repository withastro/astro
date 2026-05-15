import * as z from 'zod/v4';
const ALGORITHMS = {
	'SHA-256': 'sha256-',
	'SHA-384': 'sha384-',
	'SHA-512': 'sha512-',
};
const ALGORITHM_VALUES = Object.values(ALGORITHMS);
const cspAlgorithmSchema = z.enum(Object.keys(ALGORITHMS)).optional().default('SHA-256');
const cspHashSchema = z.custom((value) => {
	if (typeof value !== 'string') {
		return false;
	}
	return ALGORITHM_VALUES.some((allowedValue) => {
		return value.startsWith(allowedValue);
	});
});
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
];
const allowedDirectivesSchema = z
	.custom((v) => typeof v === 'string')
	.superRefine((value, ctx) => {
		const isAllowed = ALLOWED_DIRECTIVES.some((allowedValue) => {
			return value.startsWith(allowedValue);
		});
		if (!isAllowed) {
			if (value.startsWith('script-src') || value.startsWith('style-src')) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Directives \`script-src\` and \`style-src\` are not allowed in \`security.csp.directives\`. Please use \`security.csp.scriptDirective\` and \`security.csp.styleDirective\` instead.`,
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
export { ALGORITHMS, allowedDirectivesSchema, cspAlgorithmSchema, cspHashSchema };
