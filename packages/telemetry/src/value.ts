export function isEmptyPrimitive(value: unknown) {
	const isUndefined = value === undefined;
	const isNull = value === null;
	const isEmptyString = value === '';

	return isUndefined || isNull || isEmptyString;
}
