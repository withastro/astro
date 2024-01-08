import {
	type BooleanField,
	type DBFieldInput,
	type DateFieldInput,
	type JsonField,
	type NumberField,
	type TextField,
	type collectionSchema,
	collectionsSchema,
} from './types.js';
import { z } from 'zod';

export const adjustedConfigSchema = z.object({
	collections: collectionsSchema.optional(),
});

export type DBUserConfig = z.input<typeof adjustedConfigSchema>;

export const astroConfigWithDBValidator = z.object({
	db: adjustedConfigSchema.optional(),
});

export function defineCollection(
	userConfig: z.input<typeof collectionSchema>
): z.input<typeof collectionSchema> {
	return userConfig;
}

export type AstroConfigWithDB = z.infer<typeof astroConfigWithDBValidator>;

type FieldOpts<T extends DBFieldInput> = Omit<T, 'type'>;

const baseDefaults = {
	optional: false,
	unique: false,
	label: undefined,
	default: undefined,
};

export const field = {
	number(opts: FieldOpts<NumberField> = {}): NumberField {
		return { type: 'number', ...baseDefaults, ...opts };
	},
	boolean(opts: FieldOpts<BooleanField> = {}): BooleanField {
		return { type: 'boolean', ...baseDefaults, ...opts };
	},
	text(opts: FieldOpts<TextField> = {}): TextField {
		return { type: 'text', multiline: false, ...baseDefaults, ...opts };
	},
	date(opts: FieldOpts<DateFieldInput> = {}): DateFieldInput {
		return { type: 'date', ...baseDefaults, ...opts };
	},
	json(opts: FieldOpts<JsonField> = {}): JsonField {
		return { type: 'json', ...baseDefaults, ...opts };
	},
};
