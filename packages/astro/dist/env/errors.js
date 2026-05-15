function invalidVariablesToError(invalid) {
	const _errors = [];
	for (const { key, type, errors } of invalid) {
		if (errors[0] === 'missing') {
			_errors.push(`${key} is missing`);
		} else if (errors[0] === 'type') {
			_errors.push(`${key}'s type is invalid, expected: ${type}`);
		} else {
			_errors.push(`The following constraints for ${key} are not met: ${errors.join(', ')}`);
		}
	}
	return _errors;
}
export { invalidVariablesToError };
