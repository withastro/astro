import type { EnvFieldType } from './schema.js';

export type ValidationResultValue = EnvFieldType['default'];

type ValidationResult =
	| {
			ok: true;
			type: string;
			value: ValidationResultValue;
	  }
	| {
			ok: false;
			type: string;
	  };

export function getEnvFieldType(options: EnvFieldType) {
	const optional = options.optional ? (options.default !== undefined ? false : true) : false;

	let type: string;
	if (options.type === 'enum') {
		type = options.values.map((v) => `'${v}'`).join(' | ');
	} else {
		type = options.type;
	}

	return `${type}${optional ? ' | undefined' : ''}`;
}

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

const enumValidator =
	(values: Array<string>): ValueValidator =>
	(input) => {
		return {
			valid: typeof input === 'string' ? values.includes(input) : false,
			parsed: input,
		};
	};

function selectValidator(options: EnvFieldType): ValueValidator {
	switch (options.type) {
		case 'string':
			return stringValidator;
		case 'number':
			return numberValidator;
		case 'boolean':
			return booleanValidator;
		case 'enum':
			return enumValidator(options.values);
	}
}

export function validateEnvVariable(
	value: string | undefined,
	options: EnvFieldType
): ValidationResult {
	const validator = selectValidator(options);

	const type = getEnvFieldType(options);

	if (options.optional || options.default !== undefined) {
		if (value === undefined) {
			return {
				ok: true,
				value: options.default,
				type,
			};
		}
	}
	const { valid, parsed } = validator(value);
	if (valid) {
		return {
			ok: true,
			value: parsed,
			type,
		};
	}
	return {
		ok: false,
		type,
	};
}
