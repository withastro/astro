import type { Context } from './context';
import { incrementId } from './context.js';
import type { AstroPreactAttrs, PropNameToSignalMap, SignalLike } from './types';

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
	map: PropNameToSignalMap
) {
	// Check for signals
	const signals: Record<string, string> = {};
	for (const [key, value] of Object.entries(props)) {
		if (isSignal(value)) {
			// Set the value to the current signal value
			// This mutates the props on purpose, so that it will be serialized correct.
			props[key] = value.peek();
			map.set(key, value);

			let id: string;
			if (ctx.signals.has(value)) {
				id = ctx.signals.get(value)!;
			} else {
				id = incrementId(ctx);
				ctx.signals.set(value, id);
			}
			signals[key] = id;
		}
	}

	if (Object.keys(signals).length) {
		attrs['data-preact-signals'] = JSON.stringify(signals);
	}
}
