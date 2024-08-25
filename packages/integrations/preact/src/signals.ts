import type { Context } from './context.js';
import { incrementId } from './context.js';
import type { AstroPreactAttrs, PropNameToSignalMap, SignalLike } from './types.js';

function isSignal(x: any): x is SignalLike {
	return x != null && typeof x === 'object' && typeof x.peek === 'function' && 'value' in x;
}

export function restoreSignalsOnProps(ctx: Context, props: Record<string, any>) {
	// Restore signal props that were mutated for serialization
	let propMap: PropNameToSignalMap;
	if (ctx.propsToSignals.has(props)) {
		propMap = ctx.propsToSignals.get(props)!;
	} else {
		propMap = new Map();
		ctx.propsToSignals.set(props, propMap);
	}
	for (const [key, signal] of propMap) {
		props[key] = signal;
	}
	return propMap;
}

export function serializeSignals(
	ctx: Context,
	props: Record<string, any>,
	attrs: AstroPreactAttrs,
	map: PropNameToSignalMap,
) {
	// Check for signals
	const signals: Record<string, string | [string, number][]> = {};
	for (const [key, value] of Object.entries(props)) {
		if (Array.isArray(value)) {
			value.forEach((signal, index) => {
				// find signals in array. The index is important!
				if (isSignal(signal)) {
					props[key] = props[key].map((v: SignalLike, i: number) =>
						i === index ? [signal.peek(), i] : v,
					);
					map.set(key, [...((map.get(key) || []) as []), [signal, index]]);

					signals[key] = [...((signals[key] || []) as []), [getSignalId(ctx, signal), index]];
				}
			});
		} else if (isSignal(value)) {
			// Set the value to the current signal value
			// This mutates the props on purpose, so that it will be serialized correct.
			props[key] = value.peek();
			map.set(key, value);

			signals[key] = getSignalId(ctx, value);
		}
	}

	if (Object.keys(signals).length) {
		attrs['data-preact-signals'] = JSON.stringify(signals);
	}
}

function getSignalId(ctx: Context, item: SignalLike) {
	let id = ctx.signals.get(item);
	if (!id) {
		id = incrementId(ctx);
		ctx.signals.set(item, id);
	}

	return id;
}
