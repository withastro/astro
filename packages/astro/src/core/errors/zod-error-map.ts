import type { $ZodErrorMap } from 'zod/v4/core';

type TypeOrLiteralErrByPathEntry = {
	code: 'invalid_type' | 'invalid_literal';
	received: unknown;
	expected: unknown[];
	message: string | undefined;
};

export const errorMap: $ZodErrorMap = (issue) => {
	const baseErrorPath = flattenErrorPath(issue.path ?? []);
	if (issue.code === 'invalid_union') {
		// Optimization: Combine type and literal errors for keys that are common across ALL union types
		// Ex. a union between `{ key: z.literal('tutorial') }` and `{ key: z.literal('blog') }` will
		// raise a single error when `key` does not match:
		// > Did not match union.
		// > key: Expected `'tutorial' | 'blog'`, received 'foo'
		let typeOrLiteralErrByPath = new Map<string, TypeOrLiteralErrByPathEntry>();
		for (const unionError of issue.errors.flat()) {
			if (unionError.code === 'invalid_type') {
				const flattenedErrorPath = flattenErrorPath(unionError.path);
				if (typeOrLiteralErrByPath.has(flattenedErrorPath)) {
					typeOrLiteralErrByPath.get(flattenedErrorPath)!.expected.push(unionError.expected);
				} else {
					typeOrLiteralErrByPath.set(flattenedErrorPath, {
						code: unionError.code,
						received: (unionError as any).received,
						expected: [unionError.expected],
						message: unionError.message
					});
				}
			}
		}
		const messages: string[] = [prefix(baseErrorPath, 'Did not match union.')];
		const details: string[] = [...typeOrLiteralErrByPath.entries()]
			// If type or literal error isn't common to ALL union types,
			// filter it out. Can lead to confusing noise.
			.filter(([, error]) => error.expected.length === issue.errors.flat().length)
			.map(([key, error]) =>
				key === baseErrorPath
					? // Avoid printing the key again if it's a base error
						`> ${getTypeOrLiteralMsg(error)}`
					: `> ${prefix(key, getTypeOrLiteralMsg(error))}`,
			);

		if (details.length === 0) {
			const expectedShapes: string[] = [];
			for (const unionErrors of issue.errors) {
				const expectedShape: string[] = [];
				for (const _issue of unionErrors) {
					// If the issue is a nested union error, show the associated error message instead of the
					// base error message.
					if (_issue.code === 'invalid_union') {
						return errorMap(_issue as any);
					}
					const relativePath = flattenErrorPath(_issue.path)
						.replace(baseErrorPath, '')
						.replace(leadingPeriod, '');
					if ('expected' in _issue && typeof _issue.expected === 'string') {
						expectedShape.push(
							relativePath ? `${relativePath}: ${_issue.expected}` : _issue.expected,
						);
					} else if ('values' in _issue) {
						expectedShape.push(
							..._issue.values.filter((v) => typeof v === 'string').map((v) => `"${v}"`),
						);
					} else if (relativePath) {
						expectedShape.push(relativePath);
					}
				}
				if (expectedShape.length === 1 && !expectedShape[0]?.includes(':')) {
					// In this case the expected shape is not an object, but probably a literal type, e.g. `['string']`.
					expectedShapes.push(expectedShape.join(''));
				} else if (expectedShape.length > 0) {
					expectedShapes.push(`{ ${expectedShape.join('; ')} }`);
				}
			}
			if (expectedShapes.length) {
				details.push('> Expected type `' + expectedShapes.join(' | ') + '`');
				details.push('> Received `' + stringify(issue.input) + '`');
			}
		}

		return {
			message: messages.concat(details).join('\n'),
		};
	} else if (issue.code === 'invalid_type') {
		return {
			message: prefix(
				baseErrorPath,
				getTypeOrLiteralMsg({
					code: issue.code,
					received: typeof issue.input,
					expected: [issue.expected],
					message: issue.message
				}),
			),
		};
	} else if (issue.message) {
		return { message: prefix(baseErrorPath, issue.message) };
	}
};

const getTypeOrLiteralMsg = (error: TypeOrLiteralErrByPathEntry): string => {
	// received could be `undefined` or the string `'undefined'`
	if (typeof error.received === 'undefined' || error.received === 'undefined') return error.message ?? 'Required';
	const expectedDeduped = new Set(error.expected);
	switch (error.code) {
		case 'invalid_type':
			return `Expected type \`${unionExpectedVals(expectedDeduped)}\`, received \`${stringify(
				error.received,
			)}\``;
		case 'invalid_literal':
			return `Expected \`${unionExpectedVals(expectedDeduped)}\`, received \`${stringify(
				error.received,
			)}\``;
	}
};

const prefix = (key: string, msg: string) => (key.length ? `**${key}**: ${msg}` : msg);

const unionExpectedVals = (expectedVals: Set<unknown>) =>
	[...expectedVals].map((expectedVal) => stringify(expectedVal)).join(' | ');

const flattenErrorPath = (errorPath: (string | number | symbol)[]) => errorPath.join('.');

/** `JSON.stringify()` a value with spaces around object/array entries. */
const stringify = (val: unknown) =>
	JSON.stringify(val, null, 1).split(newlinePlusWhitespace).join(' ');
const newlinePlusWhitespace = /\n\s*/;
const leadingPeriod = /^\./;
