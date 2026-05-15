import { incrementId } from './context.js';
function isSignal(x) {
	return x != null && typeof x === 'object' && typeof x.peek === 'function' && 'value' in x;
}
function restoreSignalsOnProps(ctx, props) {
	let propMap;
	if (ctx.propsToSignals.has(props)) {
		propMap = ctx.propsToSignals.get(props);
	} else {
		propMap = /* @__PURE__ */ new Map();
		ctx.propsToSignals.set(props, propMap);
	}
	for (const [key, signal] of propMap) {
		props[key] = signal;
	}
	return propMap;
}
function serializeSignals(ctx, props, attrs, map) {
	const signals = {};
	for (const [key, value] of Object.entries(props)) {
		const isPropArray = Array.isArray(value);
		const isPropObject =
			!isSignal(value) && typeof props[key] === 'object' && props[key] !== null && !isPropArray;
		if (isPropObject || isPropArray) {
			const values = isPropObject ? Object.keys(props[key]) : value;
			values.forEach((valueKey, valueIndex) => {
				const signal = isPropObject ? props[key][valueKey] : valueKey;
				if (isSignal(signal)) {
					const keyOrIndex = isPropObject ? valueKey.toString() : valueIndex;
					props[key] = isPropObject
						? Object.assign({}, props[key], { [keyOrIndex]: signal.peek() })
						: props[key].map((v, i) => (i === valueIndex ? [signal.peek(), i] : v));
					const currentMap = map.get(key) || [];
					map.set(key, [...currentMap, [signal, keyOrIndex]]);
					const currentSignals = signals[key] || [];
					signals[key] = [...currentSignals, [getSignalId(ctx, signal), keyOrIndex]];
				}
			});
		} else if (isSignal(value)) {
			props[key] = value.peek();
			map.set(key, value);
			signals[key] = getSignalId(ctx, value);
		}
	}
	if (Object.keys(signals).length) {
		attrs['data-preact-signals'] = JSON.stringify(signals);
	}
}
function getSignalId(ctx, item) {
	let id = ctx.signals.get(item);
	if (!id) {
		id = incrementId(ctx);
		ctx.signals.set(item, id);
	}
	return id;
}
export { restoreSignalsOnProps, serializeSignals };
