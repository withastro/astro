import { safeParseAsync } from 'zod/v4/core';

const patchedPrototypes = new WeakSet<object>();
const patchedProps = new WeakSet<object>();

interface StandardProps {
	vendor?: string;
	validate?: (value: unknown) => unknown;
}

function makeValidate(schema: any) {
	return (value: unknown) => {
		const result =
			typeof schema.safeParseAsync === 'function'
				? schema.safeParseAsync(value)
				: safeParseAsync(schema, value);
		return result.then((parsed: any) =>
			parsed.success ? { value: parsed.data } : { issues: parsed.error?.issues ?? [] },
		);
	};
}

function patchProps(schema: object, props: StandardProps) {
	if (patchedProps.has(props as object)) return;
	patchedProps.add(props as object);
	props.validate = makeValidate(schema);
}

/**
 * Makes Zod's `~standard.validate` parse asynchronously in a single pass.
 *
 * Zod's `validate` tries a synchronous parse first. An async transform or check throws
 * `$ZodAsyncError` as soon as it starts, and that run cannot be resumed, so Zod parses a
 * second time asynchronously. Every async transform then runs twice, and a rejecting one
 * fails with nothing awaiting it, which surfaces as an unhandled rejection. `safeParseAsync`
 * parses once and hands the rejection to the caller.
 *
 * This is a temporary workaround until Zod ships the fix. Remove it and the
 * `preview-release` directory together.
 */
export function patchZodStandardSchema(schema: unknown): void {
	if (typeof schema !== 'object' || schema === null) return;
	const props = Reflect.get(schema, '~standard') as StandardProps | undefined;
	if (!props || props.vendor !== 'zod' || typeof props.validate !== 'function') return;

	const proto = Object.getPrototypeOf(schema);
	if (proto && !patchedPrototypes.has(proto)) {
		const descriptor = Object.getOwnPropertyDescriptor(proto, '~standard');
		if (descriptor?.get) {
			patchedPrototypes.add(proto);
			Object.defineProperty(proto, '~standard', {
				configurable: true,
				enumerable: descriptor.enumerable,
				set: descriptor.set,
				get(this: object) {
					const next = descriptor.get!.call(this) as StandardProps;
					patchProps(this, next);
					return next;
				},
			});
		}
	}
	patchProps(schema, props);
}
