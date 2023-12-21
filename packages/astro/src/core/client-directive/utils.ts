/**
 * @param value value of the directive (e.g. `{directive: "media", value:'(min-width: 640px)'}`)
 * @returns a normalized directive object (e.g. `{ directive: 'media', value: '(min-width: 640px)' }`). Returns `null` if the value is nullish.
 * @throws if the value of the `client:params` directive is invalid
 */
export function normalizeClientParamsDirective(value: any) {
	const maybeDirectiveOptions = value;

	// skip the transform if the value is nullish
	if (isNullish(maybeDirectiveOptions)) {
		return null;
	}

	if (!isObject(maybeDirectiveOptions)) {
		throw new Error(
			`Error: invalid \`params\` directive value ${JSON.stringify(
				maybeDirectiveOptions
			)}. Expected an object of the form \`{ directive: string, value?: any }\`, but got ${typeof maybeDirectiveOptions}.`
		);
	}

	// validate the object shape
	// it should only have two keys: `directive` and `value` (which is optional)
	for (let _key of Object.keys(maybeDirectiveOptions)) {
		if (_key !== 'directive' && _key !== 'value') {
			throw new Error(
				`Error: invalid \`params\` directive value. Expected an object of the form \`{ directive: string, value?: any }\`, but got ${JSON.stringify(
					maybeDirectiveOptions
				)}.`
			);
		}
	}

	if (typeof maybeDirectiveOptions.directive !== 'string') {
		throw new Error(
			`Error: expected \`directive\` to be a string, but got ${typeof maybeDirectiveOptions.directive}.`
		);
	}
	return {
		directive: `client:${maybeDirectiveOptions.directive}`,
		value: maybeDirectiveOptions.value,
	};
}

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object';
}

function isNullish(value: unknown): value is null | undefined {
	return typeof value === 'undefined' || value === null;
}
