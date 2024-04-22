import type { EnvFieldType } from './schema.js';

export type ValidationResultValue = EnvFieldType['default'];

type ValidationResult =
	| {
			ok: true;
			value: ValidationResultValue;
	  }
	| {
			ok: false;
			error: string;
	  };

const errorMsg = (key: string, options: EnvFieldType) => {
	const optional = options.optional ?? options.default;
	return `Variable "${key}" is not of type: ${options.type}${optional ? '| undefined' : ''}.`;
};

type ValueValidator = (input: string | undefined) => {
	valid: boolean;
	parsed: ValidationResultValue;
};

const stringValidator: ValueValidator = (input) => {
	return {
		valid: typeof input === 'string',
		parsed: input,
	};
};

const numberValidator: ValueValidator = (input) => {
	const num = parseFloat(input ?? '');
	return {
		valid: !isNaN(num),
		parsed: num,
	};
};

const booleanValidator: ValueValidator = (input) => {
	const bool = input === 'true' ? true : input === 'false' ? false : undefined;
	return {
		valid: typeof bool === 'boolean',
		parsed: bool,
	};
};

export function validateEnvVariable(
	key: string,
	value: string | undefined,
	options: EnvFieldType
): ValidationResult {
	const validator: ValueValidator = {
		string: stringValidator,
		number: numberValidator,
		boolean: booleanValidator,
	}[options.type];

	if (options.optional || options.default !== undefined) {
		if (value === undefined) {
			return {
				ok: true,
				value: options.default,
			};
		}
	}
	const { valid, parsed } = validator(value);
	if (valid) {
		return {
			ok: true,
			value: parsed,
		};
	}
	return {
		ok: false,
		error: errorMsg(key, options),
	};
}
