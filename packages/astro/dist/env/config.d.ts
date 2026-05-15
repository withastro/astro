import type {
	BooleanField,
	BooleanFieldInput,
	EnumField,
	EnumFieldInput,
	NumberField,
	NumberFieldInput,
	StringField,
	StringFieldInput,
} from './schema.js';
/**
 * Return a valid env field to use in this Astro config for `env.schema`.
 */
export declare const envField: {
	string: (options: StringFieldInput) => StringField;
	number: (options: NumberFieldInput) => NumberField;
	boolean: (options: BooleanFieldInput) => BooleanField;
	enum: <T extends string>(options: EnumFieldInput<T>) => EnumField;
};
