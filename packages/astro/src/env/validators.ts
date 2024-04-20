import type { EnvFieldType } from './schema.js';

type ValidationResult =
	| {
			ok: true;
			value: EnvFieldType['default'];
	  }
	| {
			ok: false;
			error: string;
	  };

const errorMsg = (key: string, options: EnvFieldType) => {
	const optional = options.optional ?? options.default;
	return `Variable "${key}" is not type: ${options.type}${optional ? '| undefined' : ''}.`;
};

type ValueValidator = (input: string | undefined) => {
	valid: boolean;
	parsed: EnvFieldType['default'];
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

	if (options.optional || options.default) {
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
