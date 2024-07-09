import type { EnumSchema, EnvFieldType, NumberSchema, StringSchema } from './schema.js';

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

const stringValidator =
	({ max, min, length, url, includes, startsWith, endsWith }: StringSchema): ValueValidator =>
	(input) => {
		let valid = typeof input === 'string';

		if (valid && max !== undefined) {
			valid = input!.length <= max;
		}
		if (valid && min !== undefined) {
			valid = input!.length >= min;
		}
		if (valid && length !== undefined) {
			valid = input!.length === length;
		}
		if (valid && url !== undefined) {
			try {
				new URL(input!);
			} catch (_) {
				valid = false;
			}
		}
		if (valid && includes !== undefined) {
			valid = input!.includes(includes);
		}
		if (valid && startsWith !== undefined) {
			valid = input!.startsWith(startsWith);
		}
		if (valid && endsWith !== undefined) {
			valid = input!.endsWith(endsWith);
		}

		return {
			valid,
			parsed: input,
		};
	};

const numberValidator =
	({ gt, min, lt, max, int }: NumberSchema): ValueValidator =>
	(input) => {
		const num = parseFloat(input ?? '');
		let valid = !isNaN(num);

		if (valid && gt !== undefined) {
			valid = num > gt;
		}
		if (valid && min !== undefined) {
			valid = num >= min;
		}
		if (valid && lt !== undefined) {
			valid = num < lt;
		}
		if (valid && max !== undefined) {
			valid = num <= max;
		}
		if (valid && int !== undefined) {
			const isInt = Number.isInteger(num);
			valid = int ? isInt : !isInt;
		}

		return {
			valid,
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
	({ values }: EnumSchema): ValueValidator =>
	(input) => {
		return {
			valid: typeof input === 'string' ? values.includes(input) : false,
			parsed: input,
		};
	};

function selectValidator(options: EnvFieldType): ValueValidator {
	switch (options.type) {
		case 'string':
			return stringValidator(options);
		case 'number':
			return numberValidator(options);
		case 'boolean':
			return booleanValidator;
		case 'enum':
			return enumValidator(options);
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
