import type {
	BooleanField,
	BooleanFieldInput,
	EnumFieldInput,
	NumberField,
	NumberFieldInput,
	StringField,
	StringFieldInput,
} from './schema.js';

/**
 * Return a valid env field to use in this Astro config for `env.schema`.
 */
export const envField = {
	string: (options: StringFieldInput): StringField => ({
		...options,
		type: 'string',
	} as StringField),
	number: (options: NumberFieldInput): NumberField => ({
		...options,
		type: 'number',
	} as NumberField),
	boolean: (options: BooleanFieldInput): BooleanField => ({
		...options,
		type: 'boolean',
	} as BooleanField),
	enum: <T extends string>(options: EnumFieldInput<T>): EnumFieldInput<T> & { type: 'enum' } => ({
		...options,
		type: 'enum',
	} as EnumFieldInput<T> & { type: 'enum' }),
};
