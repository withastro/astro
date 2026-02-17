/**
 * Vendored from deterministic-object-hash@2.0.2 (MIT)
 * https://github.com/nicholasgasior/deterministic-object-hash
 *
 * Only `deterministicString` is needed - the async `deterministicHash` (which
 * pulls in `node:crypto`) is intentionally excluded so this module stays
 * runtime-agnostic (works in Node, workerd, browsers, etc.).
 */

const objConstructorString = Function.prototype.toString.call(Object);

function isPlainObject(value: unknown): value is Record<string | symbol, unknown> {
	if (
		typeof value !== 'object' ||
		value === null ||
		Object.prototype.toString.call(value) !== '[object Object]'
	) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	if (proto === null) {
		return true;
	}
	if (!Object.prototype.hasOwnProperty.call(proto, 'constructor')) {
		return false;
	}
	return (
		typeof proto.constructor === 'function' &&
		proto.constructor instanceof proto.constructor &&
		Function.prototype.toString.call(proto.constructor) === objConstructorString
	);
}

/** Recursively serializes any JS value into a deterministic string. */
export function deterministicString(input: unknown): string {
	if (typeof input === 'string') {
		return JSON.stringify(input);
	} else if (typeof input === 'symbol' || typeof input === 'function') {
		return input.toString();
	} else if (typeof input === 'bigint') {
		return `${input}n`;
	} else if (
		input === globalThis ||
		input === undefined ||
		input === null ||
		typeof input === 'boolean' ||
		typeof input === 'number' ||
		typeof input !== 'object'
	) {
		return `${input}`;
	} else if (input instanceof Date) {
		return `(${input.constructor.name}:${input.getTime()})`;
	} else if (
		input instanceof RegExp ||
		input instanceof Error ||
		input instanceof WeakMap ||
		input instanceof WeakSet
	) {
		return `(${input.constructor.name}:${input.toString()})`;
	} else if (input instanceof Set) {
		let ret = `(${input.constructor.name}:[`;
		for (const val of input.values()) {
			ret += `${deterministicString(val)},`;
		}
		ret += '])';
		return ret;
	} else if (
		Array.isArray(input) ||
		input instanceof Int8Array ||
		input instanceof Uint8Array ||
		input instanceof Uint8ClampedArray ||
		input instanceof Int16Array ||
		input instanceof Uint16Array ||
		input instanceof Int32Array ||
		input instanceof Uint32Array ||
		input instanceof Float32Array ||
		input instanceof Float64Array ||
		input instanceof BigInt64Array ||
		input instanceof BigUint64Array
	) {
		let ret = `(${input.constructor.name}:[`;
		for (const [k, v] of input.entries()) {
			ret += `(${k}:${deterministicString(v)}),`;
		}
		ret += '])';
		return ret;
	} else if (input instanceof ArrayBuffer || input instanceof SharedArrayBuffer) {
		if (input.byteLength % 8 === 0) {
			return deterministicString(new BigUint64Array(input));
		} else if (input.byteLength % 4 === 0) {
			return deterministicString(new Uint32Array(input));
		} else if (input.byteLength % 2 === 0) {
			return deterministicString(new Uint16Array(input));
		} else {
			let ret = '(';
			for (let i = 0; i < input.byteLength; i++) {
				ret += `${deterministicString(new Uint8Array(input.slice(i, i + 1)))},`;
			}
			ret += ')';
			return ret;
		}
	} else if (input instanceof Map || isPlainObject(input)) {
		const sortable: [string, string][] = [];
		const entries = input instanceof Map ? input.entries() : Object.entries(input);
		for (const [k, v] of entries) {
			sortable.push([deterministicString(k), deterministicString(v)]);
		}
		if (!(input instanceof Map)) {
			const symbolKeys = Object.getOwnPropertySymbols(input);
			// eslint-disable-next-line @typescript-eslint/prefer-for-of
			for (let i = 0; i < symbolKeys.length; i++) {
				sortable.push([
					deterministicString(symbolKeys[i]!),
					deterministicString((input as Record<symbol, unknown>)[symbolKeys[i]!]),
				]);
			}
		}
		sortable.sort(([a], [b]) => a.localeCompare(b));
		let ret = `(${input.constructor.name}:[`;
		for (const [k, v] of sortable) {
			ret += `(${k}:${v}),`;
		}
		ret += '])';
		return ret;
	}

	const allEntries: [string, string][] = [];
	for (const k in input) {
		allEntries.push([
			deterministicString(k),
			deterministicString((input as Record<string, unknown>)[k]),
		]);
	}
	const symbolKeys = Object.getOwnPropertySymbols(input);
	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < symbolKeys.length; i++) {
		allEntries.push([
			deterministicString(symbolKeys[i]!),
			deterministicString((input as Record<symbol, unknown>)[symbolKeys[i]!]),
		]);
	}
	allEntries.sort(([a], [b]) => a.localeCompare(b));
	let ret = `(${input.constructor.name}:[`;
	for (const [k, v] of allEntries) {
		ret += `(${k}:${v}),`;
	}
	ret += '])';
	return ret;
}
