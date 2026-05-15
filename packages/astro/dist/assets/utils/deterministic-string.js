const objConstructorString = Function.prototype.toString.call(Object);
function isPlainObject(value) {
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
function deterministicString(input) {
	if (typeof input === 'string') {
		return JSON.stringify(input);
	} else if (typeof input === 'symbol' || typeof input === 'function') {
		return input.toString();
	} else if (typeof input === 'bigint') {
		return `${input}n`;
	} else if (
		input === globalThis ||
		input === void 0 ||
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
		let ret2 = `(${input.constructor.name}:[`;
		for (const val of input.values()) {
			ret2 += `${deterministicString(val)},`;
		}
		ret2 += '])';
		return ret2;
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
		let ret2 = `(${input.constructor.name}:[`;
		for (const [k, v] of input.entries()) {
			ret2 += `(${k}:${deterministicString(v)}),`;
		}
		ret2 += '])';
		return ret2;
	} else if (input instanceof ArrayBuffer || input instanceof SharedArrayBuffer) {
		if (input.byteLength % 8 === 0) {
			return deterministicString(new BigUint64Array(input));
		} else if (input.byteLength % 4 === 0) {
			return deterministicString(new Uint32Array(input));
		} else if (input.byteLength % 2 === 0) {
			return deterministicString(new Uint16Array(input));
		} else {
			let ret2 = '(';
			for (let i = 0; i < input.byteLength; i++) {
				ret2 += `${deterministicString(new Uint8Array(input.slice(i, i + 1)))},`;
			}
			ret2 += ')';
			return ret2;
		}
	} else if (input instanceof Map || isPlainObject(input)) {
		const sortable = [];
		const entries = input instanceof Map ? input.entries() : Object.entries(input);
		for (const [k, v] of entries) {
			sortable.push([deterministicString(k), deterministicString(v)]);
		}
		if (!(input instanceof Map)) {
			const symbolKeys2 = Object.getOwnPropertySymbols(input);
			for (let i = 0; i < symbolKeys2.length; i++) {
				sortable.push([
					deterministicString(symbolKeys2[i]),
					deterministicString(input[symbolKeys2[i]]),
				]);
			}
		}
		sortable.sort(([a], [b]) => a.localeCompare(b));
		let ret2 = `(${input.constructor.name}:[`;
		for (const [k, v] of sortable) {
			ret2 += `(${k}:${v}),`;
		}
		ret2 += '])';
		return ret2;
	}
	const allEntries = [];
	for (const k in input) {
		allEntries.push([deterministicString(k), deterministicString(input[k])]);
	}
	const symbolKeys = Object.getOwnPropertySymbols(input);
	for (let i = 0; i < symbolKeys.length; i++) {
		allEntries.push([
			deterministicString(symbolKeys[i]),
			deterministicString(input[symbolKeys[i]]),
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
export { deterministicString };
