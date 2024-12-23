import type { Context } from './context.js';
import { incrementId } from './context.js';
import type { AstroPreactAttrs, PropNameToSignalMap, SignalLike, Signals } from './types.js';

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
	const signals: Signals = {};

	function processProp(propValue: any, path: string[]): any {
		const [topLevelKey, ...restPath] = path;

		if (Array.isArray(propValue)) {
			const newArr = propValue.map((value, index) =>
				processProp(value, [topLevelKey, ...restPath, index.toString()]),
			);
			if (!signals[topLevelKey]) {
				signals[topLevelKey] = {};
			}
			return newArr;
		} else if (typeof propValue === 'object' && propValue !== null && !isSignal(propValue)) {
			const newObj: Record<string, any> = {};
			for (const [key, value] of Object.entries(propValue)) {
				newObj[key] = processProp(value, [topLevelKey, ...restPath, key]);
			}
			if (!signals[topLevelKey]) {
				signals[topLevelKey] = {};
			}
			return newObj;
		} else if (isSignal(propValue)) {
			const signalId = getSignalId(ctx, propValue);
			const nestedPath = restPath.join('.');

			if (restPath.length > 0) {
				if (!signals[topLevelKey]) {
					signals[topLevelKey] = {};
				}
				if (typeof signals[topLevelKey] !== 'string') {
					signals[topLevelKey][nestedPath] = signalId;
				}
			} else {
				signals[topLevelKey] = signalId;
			}

			map.set(path.join('.'), propValue);

			return propValue.peek();
		}
		return propValue;
	}

	for (const [key, value] of Object.entries(props)) {
		// Set the value to the current signal value
		// This mutates the props on purpose, so that it will be serialized correct.
		props[key] = processProp(value, [key]);
	}

	if (Object.keys(signals).length > 0) {
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
