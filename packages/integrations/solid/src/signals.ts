import type { Context } from './context.js';
import { incrementSignalId } from './context.js';
import {
	type IslandAccessor,
	getSetterAccessor,
	isIslandSetter,
	isIslandSignal,
	peekIslandSignal,
} from './island-signal.js';
import type {
	ArrayObjectMapping,
	AstroSolidAttrs,
	PropNameToSignalMap,
	Signals,
	SignalToKeyOrIndexMap,
} from './types.js';

export function restoreSignalsOnProps(ctx: Context, props: Record<string, any>) {
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

// Returns the accessor for the signal, whether the prop is a getter or setter.
function getAccessorForProp(value: any): IslandAccessor<any> | null {
	if (isIslandSignal(value)) return value;
	if (isIslandSetter(value)) return getSetterAccessor(value);
	return null;
}

// Signal IDs use a "!" suffix to indicate a setter prop, e.g. "sg0" = getter, "sg0!" = setter.
function encodeSignalRef(id: string, isSetter: boolean): string {
	return isSetter ? id + '!' : id;
}

/**
 * Detects island signals in props, builds the serialization mapping for `data-solid-signals`,
 * and records what needs to be restored. Does NOT mutate props yet — Solid components need
 * the signal getters to remain callable during SSR. Call `replaceSignalsWithValues` after
 * rendering to prepare props for Astro's `serializeProps`.
 */
export function serializeSignals(
	ctx: Context,
	props: Record<string, any>,
	attrs: AstroSolidAttrs,
	map: PropNameToSignalMap,
) {
	const signals: Signals = {};
	for (const [key, value] of Object.entries(props)) {
		const isPropArray = Array.isArray(value);
		const isPropObject =
			!isIslandSignal(value) &&
			!isIslandSetter(value) &&
			typeof value === 'object' &&
			value !== null &&
			!isPropArray;

		if (isPropObject || isPropArray) {
			const values = isPropObject ? Object.keys(value) : value;
			values.forEach((valueKey: number | string, valueIndex: number) => {
				const item = isPropObject ? props[key][valueKey] : valueKey;
				const accessor = getAccessorForProp(item);
				if (accessor) {
					const keyOrIndex = isPropObject ? valueKey.toString() : valueIndex;
					const isSetter = isIslandSetter(item);

					const currentMap = (map.get(key) || []) as SignalToKeyOrIndexMap;
					map.set(key, [...currentMap, [item, keyOrIndex]]);

					const currentSignals = (signals[key] || []) as ArrayObjectMapping;
					signals[key] = [
						...currentSignals,
						[encodeSignalRef(getSignalId(ctx, accessor), isSetter), keyOrIndex],
					];
				}
			});
		} else {
			const accessor = getAccessorForProp(value);
			if (accessor) {
				const isSetter = isIslandSetter(value);
				map.set(key, value);
				signals[key] = encodeSignalRef(getSignalId(ctx, accessor), isSetter);
			}
		}
	}

	if (Object.keys(signals).length) {
		attrs['data-solid-signals'] = JSON.stringify(signals);
	}
}

/**
 * Replaces island signal getters/setters on props with their peeked scalar values.
 * Call this AFTER SSR rendering so that Astro's `serializeProps` gets plain values.
 */
export function replaceSignalsWithValues(props: Record<string, any>) {
	for (const [key, value] of Object.entries(props)) {
		const isPropArray = Array.isArray(value);
		const isPropObject =
			!isIslandSignal(value) &&
			!isIslandSetter(value) &&
			typeof value === 'object' &&
			value !== null &&
			!isPropArray;

		if (isPropObject || isPropArray) {
			const values = isPropObject ? Object.keys(value) : value;
			values.forEach((valueKey: number | string, valueIndex: number) => {
				const item = isPropObject ? props[key][valueKey] : valueKey;
				const accessor = getAccessorForProp(item);
				if (accessor) {
					const keyOrIndex = isPropObject ? valueKey.toString() : valueIndex;
					props[key] = isPropObject
						? Object.assign({}, props[key], { [keyOrIndex]: peekIslandSignal(accessor) })
						: props[key].map((v: any, i: number) =>
								i === valueIndex ? [peekIslandSignal(accessor), i] : v,
							);
				}
			});
		} else {
			const accessor = getAccessorForProp(value);
			if (accessor) {
				props[key] = peekIslandSignal(accessor);
			}
		}
	}
}

function getSignalId(ctx: Context, accessor: IslandAccessor<any>) {
	let id = ctx.signals.get(accessor);
	if (!id) {
		id = incrementSignalId(ctx);
		ctx.signals.set(accessor, id);
	}
	return id;
}
