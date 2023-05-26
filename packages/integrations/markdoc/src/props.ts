import z from 'zod';
import type { SchemaAttribute } from '@markdoc/markdoc';

type PropFields = Record<string, ReturnType<(typeof field)[keyof typeof field]>>;

export function markdocAttributesFromZodProps(
	zodProps: PropFields
): Record<string, SchemaAttribute> {
	let attributes: Record<string, SchemaAttribute> = {};

	for (const [key, wrappedVal] of Object.entries(zodProps)) {
		let val = wrappedVal;
		attributes[key] = {
			required: true,
		};
		if (wrappedVal instanceof z.ZodOptional) {
			attributes[key].required = false;
			val = wrappedVal.unwrap();
		}
		if (val instanceof z.ZodString) {
			attributes[key].type = 'String';
		}
		if (val instanceof z.ZodEnum) {
			if (!isStrArray(val.options)) throw new Error('Enum values must be strings');
			attributes[key].type = 'String';
			attributes[key].matches = val.options;
		}
	}

	return attributes;
}

function isStrArray(val: any): val is string[] {
	return Array.isArray(val) && val.every((v) => typeof v === 'string');
}

export const field = {
	boolean: z.boolean,
	string: z.string,
	enum: z.enum,
};

export const usedDefinePropsSymbol = Symbol.for('usedDefineProps');

export function isPropsDef(props: unknown): props is ReturnType<typeof defineProps> {
	return typeof props === 'object' && props != null && usedDefinePropsSymbol in props;
}

export function defineProps(props: PropFields): PropFields {
	return Object.assign(props, {
		// Used to check that `.props.js` files use our helper to define.
		// Cheapest type check you can have!
		[usedDefinePropsSymbol]: true,
	});
}
