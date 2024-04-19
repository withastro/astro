type Options =
	| {
			type: 'string';
			optional?: boolean;
			default?: string;
	  }
	| {
			type: 'number';
			optional?: boolean;
			default?: number;
	  }
	| {
			type: 'boolean';
			optional?: boolean;
			default?: boolean;
	  };

type ValidationResult =
	| {
			ok: true;
			value: string | number | boolean | undefined;
	  }
	| {
			ok: false;
			error: string;
	  };

const errorMsg = (key: string, options: Options) => {
	const optional = options.optional ?? options.default;
	return `Variable "${key}" is not type: ${options.type}${optional ? '| undefined' : ''}.`;
};

type ValueValidator = (input: string | undefined) => {
	valid: boolean;
	parsed: string | number | boolean | undefined;
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
	options: Options
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
