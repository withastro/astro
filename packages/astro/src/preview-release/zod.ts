// Temporary. This whole module, and the `preview-release` directory it lives in, exist only
// to ship the preview. Remove them, and their callers, once Zod ships its
// `~standard.validate` fix.

const patchedPrototypes = new WeakSet<object>();
const patchedProps = new WeakSet<object>();

interface StandardProps {
	vendor?: string;
	validate?: (value: unknown) => unknown;
}

/** Marks a patched `run` so a later patch can rebase on the true implementation. */
const FORCE_ASYNC_ORIGIN = Symbol('astro.zod.forceAsync.origin');

function makeValidate(schema: any, original: NonNullable<StandardProps['validate']>) {
	return (value: unknown) => {
		// The classic and mini entrypoints put `safeParseAsync` on the schema itself. The
		// core entrypoint does not, so its `~standard.validate` is forced down its async
		// branch instead, which parses once and finalizes the issues the same way.
		if (typeof schema.safeParseAsync === 'function') {
			return schema
				.safeParseAsync(value)
				.then((parsed: any) =>
					parsed.success ? { value: parsed.data } : { issues: parsed.error?.issues ?? [] },
				);
		}
		return forceAsyncValidate(schema, original, value);
	};
}

/**
 * Makes `validate` take its async branch on the first pass. `validate` runs the schema
 * synchronously first and only falls back to an async run when that first pass throws, so
 * making the sync pass throw immediately leaves exactly one run. The patched `run` is
 * restored before returning: `validate` invokes `run` synchronously, and the async run it
 * hands back has already started.
 */
function forceAsyncValidate(
	schema: any,
	original: NonNullable<StandardProps['validate']>,
	value: unknown,
) {
	const internals = schema._zod;
	const currentRun = internals?.run;
	if (typeof currentRun !== 'function') return original(value);

	const originalRun = currentRun[FORCE_ASYNC_ORIGIN] ?? currentRun;
	let syncPass = true;
	const forcedRun = function (this: unknown, payload: unknown, ctx?: { async?: boolean }) {
		if (syncPass && ctx?.async === false) {
			syncPass = false;
			throw new Error('astro.zod.forceAsync');
		}
		return originalRun.call(this, payload, ctx);
	};
	(forcedRun as any)[FORCE_ASYNC_ORIGIN] = originalRun;
	internals.run = forcedRun;
	try {
		return original(value);
	} finally {
		if (internals.run === forcedRun) internals.run = originalRun;
	}
}

function patchProps(schema: object, props: StandardProps) {
	if (patchedProps.has(props as object)) return;
	patchedProps.add(props as object);
	props.validate = makeValidate(schema, props.validate!);
}

/**
 * Makes Zod's `~standard.validate` parse asynchronously in a single pass.
 *
 * Zod's `validate` tries a synchronous parse first. An async transform or check throws
 * `$ZodAsyncError` as soon as it starts, and that run cannot be resumed, so Zod parses a
 * second time asynchronously. Every async transform then runs twice, and a rejecting one
 * fails with nothing awaiting it, which surfaces as an unhandled rejection. This replaces
 * `validate` with a single async pass and does not import Zod, so importing this helper
 * does not ship Zod to apps that never validate with it.
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
