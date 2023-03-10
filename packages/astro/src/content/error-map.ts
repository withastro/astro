import type { ZodErrorMap, ZodInvalidLiteralIssue, ZodInvalidTypeIssue } from 'zod';

export const errorMap: ZodErrorMap = (error, ctx) => {
	if (error.code === 'invalid_union') {
		console.log('union', error);
		let expectedByErrorPath: Map<
			string,
			{ code: 'invalid_type' | 'invalid_literal'; received: unknown; expected: unknown[] }
		> = new Map();
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
							.filter((e) => !formattedErrorTypes.has(e.code))
							.map((e) => errorMap(e, ctx).message)
					)
				)
				.join('\n'),
		};
	}
	const key = flattenErrorPath(error.path);
	if (error.message) {
		return { message: prefix(key, error.message) };
	}
	return { message: prefix(key, ctx.defaultError) };
};

const formattedErrorTypes = new Set(['invalid_type', 'invalid_literal']);

const getFormattedErrorMsg = ({
	key,
	error,
}: {
	key: string;
	error: Pick<ZodInvalidLiteralIssue | ZodInvalidTypeIssue, 'code' | 'expected' | 'received'>;
}): string => {
	switch (error.code) {
		case 'invalid_type':
			if (error.received === 'undefined') return isRequiredMsg(key);
			return prefix(
				key,
				`Expected type ${unionExpectedVals(String(error.expected))}, received ${singleQuote(
					String(error.received)
				)}`
			);
		case 'invalid_literal':
			if (typeof error.received === 'undefined') return isRequiredMsg(key);
			return prefix(
				key,
				`Expected ${unionExpectedVals(String(error.expected))}, received ${singleQuote(
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

const unionExpectedVals = (expectedVals: string | string[]) => {
	const arr = Array.isArray(expectedVals) ? expectedVals : [expectedVals];
	return arr
		.map((expectedVal, idx) => {
			if (idx === 0) return singleQuote(expectedVal);
			const sep = ' | ';
			return `${sep}${singleQuote(expectedVal)}`;
		})
		.join('');
};

const flattenErrorPath = (errorPath: (string | number)[]) => errorPath.join('.');
