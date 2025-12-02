import type { ZodErrorMap } from 'zod';

type TypeOrLiteralErrByPathEntry = {
	code: 'invalid_type' | 'invalid_literal';
	received: unknown;
	expected: unknown[];
};

export const errorMap: ZodErrorMap = ((iss: any) => {
	try {
		// In Zod 4, iss.path is the path array
		const basePath = iss.path ?? [];
		const baseErrorPath = flattenErrorPath(basePath);
		if (iss.code === 'invalid_union') {
		// Optimization: Combine type and literal errors for keys that are common across ALL union types
		// Ex. a union between `{ key: z.literal('tutorial') }` and `{ key: z.literal('blog') }` will
		// raise a single error when `key` does not match:
		// > Did not match union.
		// > key: Expected `'tutorial' | 'blog'`, received 'foo'

		// In Zod 4, unionErrors may not be available in customError
		if (!iss.unionErrors) {
			return { message: 'Did not match union.' };
		}

		let typeOrLiteralErrByPath = new Map<string, TypeOrLiteralErrByPathEntry>();
		for (const unionError of iss.unionErrors.map((e: any) => e.issues).flat()) {
			if (unionError.code === 'invalid_type' || unionError.code === 'invalid_literal') {
				const flattenedErrorPath = flattenErrorPath(unionError.path);
				if (typeOrLiteralErrByPath.has(flattenedErrorPath)) {
					typeOrLiteralErrByPath.get(flattenedErrorPath)!.expected.push(unionError.expected);
				} else {
					typeOrLiteralErrByPath.set(flattenedErrorPath, {
						code: unionError.code,
						received: (unionError as any).input,
						expected: [unionError.expected],
					});
				}
			}
		}
		const messages: string[] = [prefix(baseErrorPath, 'Did not match union.')];
		const details: string[] = [...typeOrLiteralErrByPath.entries()]
			// If type or literal error isn't common to ALL union types,
			// filter it out. Can lead to confusing noise.
			.filter(([, error]) => error.expected.length === iss.unionErrors.length)
			.map(([key, error]) =>
				key === baseErrorPath
					? // Avoid printing the key again if it's a base error
						`> ${getTypeOrLiteralMsg(error)}`
					: `> ${prefix(key, getTypeOrLiteralMsg(error))}`,
			);

		if (details.length === 0) {
			const expectedShapes: string[] = [];
			for (const unionError of iss.unionErrors) {
				const expectedShape: string[] = [];
				for (const issue of unionError.issues) {
					// If the issue is a nested union error, show the associated error message instead of the
					// base error message.
					if (issue.code === 'invalid_union') {
						// Recursively handle nested union errors
						if ((issue as any).unionErrors) {
							// Return early - we can't recursively call errorMap with ZodErrorMap signature
							return { message: 'Did not match union' };
						}
					}
					const relativePath = flattenErrorPath(issue.path)
						.replace(baseErrorPath, '')
						.replace(leadingPeriod, '');
					if ('expected' in issue && typeof issue.expected === 'string') {
						expectedShape.push(
							relativePath ? `${relativePath}: ${issue.expected}` : issue.expected,
						);
					} else {
						expectedShape.push(relativePath);
					}
				}
				if (expectedShape.length === 1 && !expectedShape[0]?.includes(':')) {
					// In this case the expected shape is not an object, but probably a literal type, e.g. `['string']`.
					expectedShapes.push(expectedShape.join(''));
				} else {
					expectedShapes.push(`{ ${expectedShape.join('; ')} }`);
				}
			}
			if (expectedShapes.length) {
				details.push('> Expected type `' + expectedShapes.join(' | ') + '`');
				details.push('> Received `' + stringify(iss.input) + '`');
			}
		}

		return {
			message: messages.concat(details).join('\n'),
		};
	} else if (iss.code === 'invalid_literal' || iss.code === 'invalid_type') {
		return {
			message: prefix(
				baseErrorPath,
				getTypeOrLiteralMsg({
					code: iss.code,
					received: (iss as any).input,
					expected: [iss.expected],
				}),
			),
		};
	} else if (iss.message) {
		return { message: prefix(baseErrorPath, iss.message) };
	} else if (iss.code === 'too_small') {
		const minimum = (iss as any).minimum;
		const inclusive = (iss as any).inclusive;
		const msg = inclusive ? `at least ${minimum}` : `more than ${minimum}`;
		return { message: prefix(baseErrorPath, `Array must contain ${msg} element(s)`) };
	} else {
		// In Zod 4, there's no ctx.defaultError, use a default message
		return { message: prefix(baseErrorPath, 'Invalid input') };
	}
	} catch (error) {
		console.error('DEBUG errorMap error:', error);
		throw error;
	}
}) as ZodErrorMap;

const getTypeOrLiteralMsg = (error: TypeOrLiteralErrByPathEntry): string => {
	// received could be `undefined` or the string `'undefined'`
	if (typeof error.received === 'undefined' || error.received === 'undefined') return 'Required';
	const expectedDeduped = new Set(error.expected);
	switch (error.code) {
		case 'invalid_type':
			// For invalid_type, show the type of the received value
			const receivedType = error.received === null ? 'null' : typeof error.received;
			return `Expected type \`${unionExpectedVals(expectedDeduped)}\`, received \`"${receivedType}"\``;
		case 'invalid_literal':
			return `Expected \`${unionExpectedVals(expectedDeduped)}\`, received \`${stringify(
				error.received,
			)}\``;
	}
};

const prefix = (key: string, msg: string) => (key.length ? `**${key}**: ${msg}` : msg);

const unionExpectedVals = (expectedVals: Set<unknown>) =>
	[...expectedVals].map((expectedVal) => stringify(expectedVal)).join(' | ');

const flattenErrorPath = (errorPath: (string | number)[]) => errorPath.join('.');

/** `JSON.stringify()` a value with spaces around object/array entries. */
const stringify = (val: unknown) =>
	JSON.stringify(val, null, 1).split(newlinePlusWhitespace).join(' ');
const newlinePlusWhitespace = /\n\s*/;
const leadingPeriod = /^\./;
