import type {
	BooleanField,
	BooleanFieldInput,
	NumberField,
	NumberFieldInput,
	StringField,
	StringFieldInput,
} from './schema.js';
/**
 * TODO:
 */
export const envField = {
	string: (options: StringFieldInput): StringField => ({
		...options,
		type: 'string',
	}),
	number: (options: NumberFieldInput): NumberField => ({
		...options,
		type: 'number',
	}),
	boolean: (options: BooleanFieldInput): BooleanField => ({
		...options,
		type: 'boolean',
	}),
};
