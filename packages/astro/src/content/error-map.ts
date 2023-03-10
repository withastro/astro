import type { ZodErrorMap, ZodInvalidLiteralIssue, ZodInvalidTypeIssue } from 'zod';

const formattedErrorTypes = ['invalid_type', 'invalid_literal'] as const;
type ExpectedByErrorPathEntry = {
	code: (typeof formattedErrorTypes)[number];
	received: unknown;
	expected: unknown[];
};

export const errorMap: ZodErrorMap = (error, ctx) => {
	if (error.code === 'invalid_union') {
		let expectedByErrorPath: Map<string, ExpectedByErrorPathEntry> = new Map();
		let messages: string[] = [];
		for (const unionError of error.unionErrors.map((e) => e.errors).flat()) {
			if (unionError.code === 'invalid_type' || unionError.code === 'invalid_literal') {
				const flattenedErrorPath = flattenErrorPath(unionError.path);
				if (expectedByErrorPath.has(flattenedErrorPath)) {
					expectedByErrorPath.get(flattenedErrorPath)!.expected.push(unionError.expected);
				} else {
					expectedByErrorPath.set(flattenedErrorPath, {
						code: unionError.code,
						received: unionError.received,
						expected: [unionError.expected],
					});
				}
			}
		}
		return {
			message: messages
				// Format invalid type and invalid literal errors
				.concat(
					[...expectedByErrorPath.entries()].map(([key, error]) =>
						getFormattedErrorMsg({ key, error })
					)
				)
				.concat(
					// Format remaining errors recursively with errorMap
					error.unionErrors.flatMap((unionError) =>
						unionError.errors
							.filter((e) => !formattedErrorTypes.includes(e.code as any))
							.map((e) => errorMap(e, ctx).message)
					)
				)
				.join('\n'),
		};
	}
	const key = flattenErrorPath(error.path);
	if (error.code === 'invalid_literal' || error.code === 'invalid_type') {
		return {
			message: getFormattedErrorMsg({
				key,
				error: {
					code: error.code,
					received: error.received,
					expected: [error.expected],
				},
			}),
		};
	} else if (error.message) {
		return { message: prefix(key, error.message) };
	} else {
		return { message: prefix(key, ctx.defaultError) };
	}
};

const getFormattedErrorMsg = ({
	key,
	error,
}: {
	key: string;
	error: ExpectedByErrorPathEntry;
}): string => {
	switch (error.code) {
		case 'invalid_type':
			if (error.received === 'undefined') return isRequiredMsg(key);
			return prefix(
				key,
				`Expected type ${unionExpectedVals(error.expected)}, received ${singleQuote(
					String(error.received)
				)}`
			);
		case 'invalid_literal':
			if (typeof error.received === 'undefined') return isRequiredMsg(key);
			return prefix(
				key,
				`Expected ${unionExpectedVals(error.expected)}, received ${singleQuote(
					String(error.received)
				)}`
			);
	}
};

const isRequiredMsg = (key: string) => prefix(key, 'Required.');

const prefix = (key: string, msg: string) => `${key}: ${msg}`;

// Wrap identifiers in single quotes
// to match Zod's default error messages
const singleQuote = (str: string) => `'${str}'`;

const unionExpectedVals = (expectedVals: unknown[]) => {
	return expectedVals
		.map((expectedVal, idx) => {
			if (idx === 0) return singleQuote(String(expectedVal));
			const sep = ' | ';
			return `${sep}${singleQuote(String(expectedVal))}`;
		})
		.join('');
};

const flattenErrorPath = (errorPath: (string | number)[]) => errorPath.join('.');
