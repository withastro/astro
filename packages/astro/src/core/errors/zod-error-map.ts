import type { ZodErrorMap } from 'zod';

type TypeOrLiteralErrByPathEntry = {
	code: 'invalid_type' | 'invalid_literal';
	received: unknown;
	expected: unknown[];
};

export const errorMap: ZodErrorMap = (baseError, ctx) => {
	const baseErrorPath = flattenErrorPath(baseError.path);
	if (baseError.code === 'invalid_union') {
		// Optimization: Combine type and literal errors for keys that are common across ALL union types
		// Ex. a union between `{ key: z.literal('tutorial') }` and `{ key: z.literal('blog') }` will
		// raise a single error when `key` does not match:
		// > Did not match union.
		// > key: Expected `'tutorial' | 'blog'`, received 'foo'
		let typeOrLiteralErrByPath = new Map<string, TypeOrLiteralErrByPathEntry>();
		for (const unionError of baseError.unionErrors.map((e) => e.errors).flat()) {
			if (unionError.code === 'invalid_type' || unionError.code === 'invalid_literal') {
				const flattenedErrorPath = flattenErrorPath(unionError.path);
				if (typeOrLiteralErrByPath.has(flattenedErrorPath)) {
					typeOrLiteralErrByPath.get(flattenedErrorPath)!.expected.push(unionError.expected);
				} else {
					typeOrLiteralErrByPath.set(flattenedErrorPath, {
						code: unionError.code,
						received: (unionError as any).received,
						expected: [unionError.expected],
					});
				}
			}
		}
		let messages: string[] = [
			prefix(
				baseErrorPath,
				typeOrLiteralErrByPath.size ? 'Did not match union:' : 'Did not match union.',
			),
		];
		return {
			message: messages
				.concat(
					[...typeOrLiteralErrByPath.entries()]
						// If type or literal error isn't common to ALL union types,
						// filter it out. Can lead to confusing noise.
						.filter(([, error]) => error.expected.length === baseError.unionErrors.length)
						.map(([key, error]) =>
							key === baseErrorPath
								? // Avoid printing the key again if it's a base error
									`> ${getTypeOrLiteralMsg(error)}`
								: `> ${prefix(key, getTypeOrLiteralMsg(error))}`,
						),
				)
				.join('\n'),
		};
	}
	if (baseError.code === 'invalid_literal' || baseError.code === 'invalid_type') {
		return {
			message: prefix(
				baseErrorPath,
				getTypeOrLiteralMsg({
					code: baseError.code,
					received: (baseError as any).received,
					expected: [baseError.expected],
				}),
			),
		};
	} else if (baseError.message) {
		return { message: prefix(baseErrorPath, baseError.message) };
	} else {
		return { message: prefix(baseErrorPath, ctx.defaultError) };
	}
};

const getTypeOrLiteralMsg = (error: TypeOrLiteralErrByPathEntry): string => {
	if (error.received === 'undefined') return 'Required';
	const expectedDeduped = new Set(error.expected);
	switch (error.code) {
		case 'invalid_type':
			return `Expected type \`${unionExpectedVals(expectedDeduped)}\`, received ${JSON.stringify(
				error.received,
			)}`;
		case 'invalid_literal':
			return `Expected \`${unionExpectedVals(expectedDeduped)}\`, received ${JSON.stringify(
				error.received,
			)}`;
	}
};

const prefix = (key: string, msg: string) => (key.length ? `**${key}**: ${msg}` : msg);

const unionExpectedVals = (expectedVals: Set<unknown>) =>
	[...expectedVals]
		.map((expectedVal, idx) => {
			if (idx === 0) return JSON.stringify(expectedVal);
			const sep = ' | ';
			return `${sep}${JSON.stringify(expectedVal)}`;
		})
		.join('');

const flattenErrorPath = (errorPath: (string | number)[]) => errorPath.join('.');
