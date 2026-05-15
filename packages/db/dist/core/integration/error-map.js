const errorMap = (issue) => {
	const baseErrorPath = flattenErrorPath(issue.path ?? []);
	if (issue.code === 'invalid_union') {
		let typeOrLiteralErrByPath = /* @__PURE__ */ new Map();
		for (const unionError of issue.errors.flat()) {
			if (unionError.code === 'invalid_type') {
				const flattenedErrorPath = flattenErrorPath(unionError.path);
				if (typeOrLiteralErrByPath.has(flattenedErrorPath)) {
					typeOrLiteralErrByPath.get(flattenedErrorPath).expected.push(unionError.expected);
				} else {
					typeOrLiteralErrByPath.set(flattenedErrorPath, {
						code: unionError.code,
						received: unionError.received,
						expected: [unionError.expected],
						message: unionError.message,
					});
				}
			}
		}
		const messages = [prefix(baseErrorPath, 'Did not match union.')];
		const details = [...typeOrLiteralErrByPath.entries()]
			.filter(([, error]) => error.expected.length === issue.errors.flat().length)
			.map(([key, error]) =>
				key === baseErrorPath
					? // Avoid printing the key again if it's a base error
						`> ${getTypeOrLiteralMsg(error)}`
					: `> ${prefix(key, getTypeOrLiteralMsg(error))}`,
			);
		if (details.length === 0) {
			if ('discriminator' in issue && issue.discriminator && 'options' in issue) {
				const options = issue.options;
				if (Array.isArray(options)) {
					details.push(
						`> Expected \`${issue.discriminator}\` to be ${options.map((o) => `\`${stringify(o)}\``).join(' | ')}`,
					);
					details.push('> Received `' + stringify(issue.input) + '`');
				}
			}
		}
		if (details.length === 0) {
			const expectedShapes = [];
			for (const unionErrors of issue.errors) {
				const expectedShape = [];
				for (const _issue of unionErrors) {
					if (_issue.code === 'invalid_union') {
						return errorMap(_issue);
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
	} else if (issue.code === 'invalid_key') {
		const keyIssues = issue.issues;
		if (Array.isArray(keyIssues) && keyIssues.length > 0) {
			const firstIssue = keyIssues[0];
			const msg = firstIssue.message || 'Invalid key in record';
			return { message: prefix(baseErrorPath, msg) };
		}
		return { message: prefix(baseErrorPath, 'Invalid key in record') };
	} else if (issue.code === 'invalid_element') {
		const elementIssues = issue.issues;
		if (Array.isArray(elementIssues) && elementIssues.length > 0) {
			const firstIssue = elementIssues[0];
			const msg = firstIssue.message || 'Invalid element';
			return { message: prefix(baseErrorPath, msg) };
		}
		return { message: prefix(baseErrorPath, 'Invalid element') };
	} else if (issue.code === 'invalid_type') {
		return {
			message: prefix(
				baseErrorPath,
				getTypeOrLiteralMsg({
					code: issue.code,
					received: typeof issue.input,
					expected: [issue.expected],
					message: issue.message,
				}),
			),
		};
	} else if (issue.message) {
		return { message: prefix(baseErrorPath, issue.message) };
	}
};
const getTypeOrLiteralMsg = (error) => {
	if (typeof error.received === 'undefined' || error.received === 'undefined')
		return error.message ?? 'Required';
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
const prefix = (key, msg) => (key.length ? `**${key}**: ${msg}` : msg);
const unionExpectedVals = (expectedVals) =>
	[...expectedVals].map((expectedVal) => stringify(expectedVal)).join(' | ');
const flattenErrorPath = (errorPath) => errorPath.join('.');
const stringify = (val) => JSON.stringify(val, null, 1).split(newlinePlusWhitespace).join(' ');
const newlinePlusWhitespace = /\n\s*/;
const leadingPeriod = /^\./;
export { errorMap };
