// Based off of https://www.npmjs.com/package/serialize-javascript
// Had to replace `random-bytes` so it worked better in the browser

/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

import { randomBytes } from './random-bytes';

// Generate an internal UID to make the regexp pattern harder to guess.
const UID_LENGTH = 16;
const UID = generateUID();
const PLACE_HOLDER_REGEXP = new RegExp(
	'(\\\\)?"@__(F|R|D|M|S|A|U|I|B|L)-' + UID + '-(\\d+)__@"',
	'g'
);

const IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
const IS_PURE_FUNCTION = /function.*?\(/;
const IS_ARROW_FUNCTION = /.*?=>.*?/;
const UNSAFE_CHARS_REGEXP = /[<>\/\u2028\u2029]/g;

const RESERVED_SYMBOLS = ['*', 'async'];

// Mapping of unsafe HTML and invalid JavaScript line terminator chars to their
// Unicode char counterparts which are safe to use in JavaScript strings.
const ESCAPED_CHARS = {
	'<': '\\u003C',
	'>': '\\u003E',
	'/': '\\u002F',
	'\u2028': '\\u2028',
	'\u2029': '\\u2029',
};

function escapeUnsafeChars(
	unsafeChar: keyof typeof ESCAPED_CHARS
): typeof ESCAPED_CHARS[keyof typeof ESCAPED_CHARS] {
	return ESCAPED_CHARS[unsafeChar];
}

function generateUID() {
	let bytes = randomBytes(UID_LENGTH) as Uint32Array;
	let result = '';
	for (let i = 0; i < UID_LENGTH; ++i) {
		result += bytes[i].toString(16);
	}
	return result;
}

function deleteFunctions(obj: Record<any, any>) {
	let functionKeys = [];
	for (let key in obj) {
		if (typeof obj[key] === 'function') {
			functionKeys.push(key);
		}
	}
	for (let i = 0; i < functionKeys.length; i++) {
		delete obj[functionKeys[i]];
	}
}

export type TypeGenericFunction = (...args: any[]) => any;
export function serialize(
	obj: Record<any, any> | any,
	options?: number | string | Record<any, any>
): string | any {
	options || (options = {});

	// Backwards-compatibility for `space` as the second argument.
	if (typeof options === 'number' || typeof options === 'string') {
		options = { space: options };
	}

	let functions: TypeGenericFunction[] = [];
	let regexps: RegExp[] = [];
	let dates: Date[] = [];
	let maps: Map<any, any>[] = [];
	let sets: Set<any>[] = [];
	let arrays: any[] = [];
	let undefs: undefined[] = [];
	let infinities: typeof Infinity[] = [];
	let bigInts: BigInt[] = [];
	let urls: URL[] = [];

	// Returns placeholders for functions and regexps (identified by index)
	// which are later replaced by their string representation.
	function replacer(key: any, value: any) {
		// For nested function
		// @ts-ignore
		if (options.ignoreFunction) {
			deleteFunctions(value);
		}

		if (!value && value !== undefined) {
			return value;
		}

		// If the value is an object w/ a toJSON method, toJSON is called before
		// the replacer runs, so we use this[key] to get the non-toJSONed value.
		// @ts-ignore
		let origValue = (this as any)[key];
		let type = typeof origValue;

		if (type === 'object') {
			if (origValue instanceof RegExp) {
				return '@__R-' + UID + '-' + (regexps.push(origValue) - 1) + '__@';
			}

			if (origValue instanceof Date) {
				return '@__D-' + UID + '-' + (dates.push(origValue) - 1) + '__@';
			}

			if (origValue instanceof Map) {
				return '@__M-' + UID + '-' + (maps.push(origValue) - 1) + '__@';
			}

			if (origValue instanceof Set) {
				return '@__S-' + UID + '-' + (sets.push(origValue) - 1) + '__@';
			}

			if (origValue instanceof Array) {
				let isSparse =
					origValue.filter(function () {
						return true;
					}).length !== origValue.length;
				if (isSparse) {
					return '@__A-' + UID + '-' + (arrays.push(origValue) - 1) + '__@';
				}
			}

			if (origValue instanceof URL) {
				return '@__L-' + UID + '-' + (urls.push(origValue) - 1) + '__@';
			}
		}

		if (type === 'function') {
			return '@__F-' + UID + '-' + (functions.push(origValue) - 1) + '__@';
		}

		if (type === 'undefined') {
			return '@__U-' + UID + '-' + (undefs.push(origValue) - 1) + '__@';
		}

		if (type === 'number' && !isNaN(origValue) && !isFinite(origValue)) {
			return '@__I-' + UID + '-' + (infinities.push(origValue) - 1) + '__@';
		}

		if (type === 'bigint') {
			return '@__B-' + UID + '-' + (bigInts.push(origValue) - 1) + '__@';
		}

		return value;
	}

	function serializeFunc(fn: TypeGenericFunction) {
		let serializedFn = fn.toString();
		if (IS_NATIVE_CODE_REGEXP.test(serializedFn)) {
			throw new TypeError('Serializing native function: ' + fn.name);
		}

		// pure functions, example: {key: function() {}}
		if (IS_PURE_FUNCTION.test(serializedFn)) {
			return serializedFn;
		}

		// arrow functions, example: arg1 => arg1+5
		if (IS_ARROW_FUNCTION.test(serializedFn)) {
			return serializedFn;
		}

		let argsStartsAt = serializedFn.indexOf('(');
		let def = serializedFn
			.substr(0, argsStartsAt)
			.trim()
			.split(' ')
			.filter(function (val: string) {
				return val.length > 0;
			});

		let nonReservedSymbols = def.filter(function (val: string) {
			return RESERVED_SYMBOLS.indexOf(val) === -1;
		});

		// enhanced literal objects, example: {key() {}}
		if (nonReservedSymbols.length > 0) {
			return (
				(def.indexOf('async') > -1 ? 'async ' : '') +
				'function' +
				(def.join('').indexOf('*') > -1 ? '*' : '') +
				serializedFn.substr(argsStartsAt)
			);
		}

		// arrow functions
		return serializedFn;
	}

	// Check if the parameter is function
	if (options.ignoreFunction && typeof obj === 'function') {
		obj = undefined;
	}
	// Protects against `JSON.stringify()` returning `undefined`, by serializing
	// to the literal string: "undefined".
	if (obj === undefined) {
		return String(obj);
	}

	let str;

	// Creates a JSON string representation of the value.
	// NOTE: Node 0.12 goes into slow mode with extra JSON.stringify() args.
	if (options.isJSON && !options.space) {
		str = JSON.stringify(obj);
	} else {
		// @ts-ignore
		str = JSON.stringify(obj, options.isJSON ? null : replacer, options.space);
	}

	// Protects against `JSON.stringify()` returning `undefined`, by serializing
	// to the literal string: "undefined".
	if (typeof str !== 'string') {
		return String(str);
	}

	// Replace unsafe HTML and invalid JavaScript line terminator chars with
	// their safe Unicode char counterpart. This _must_ happen before the
	// regexps and functions are serialized and added back to the string.
	if (options.unsafe !== true) {
		// @ts-ignore
		str = str.replace(UNSAFE_CHARS_REGEXP, escapeUnsafeChars);
	}

	if (
		functions.length === 0 &&
		regexps.length === 0 &&
		dates.length === 0 &&
		maps.length === 0 &&
		sets.length === 0 &&
		arrays.length === 0 &&
		undefs.length === 0 &&
		infinities.length === 0 &&
		bigInts.length === 0 &&
		urls.length === 0
	) {
		return str;
	}

	// Replaces all occurrences of function, regexp, date, map and set placeholders in the
	// JSON string with their string representations. If the original value can
	// not be found, then `undefined` is used.
	// @ts-ignore
	return str.replace(PLACE_HOLDER_REGEXP, function (match, backSlash, type, valueIndex) {
		// The placeholder may not be preceded by a backslash. This is to prevent
		// replacing things like `"a\"@__R-<UID>-0__@"` and thus outputting
		// invalid JS.
		if (backSlash) {
			return match;
		}

		if (type === 'D') {
			return 'new Date("' + dates[valueIndex].toISOString() + '")';
		}

		if (type === 'R') {
			return (
				'new RegExp(' +
				serialize(regexps[valueIndex].source) +
				', "' +
				regexps[valueIndex].flags +
				'")'
			);
		}

		if (type === 'M') {
			return 'new Map(' + serialize(Array.from(maps[valueIndex].entries()), options) + ')';
		}

		if (type === 'S') {
			return 'new Set(' + serialize(Array.from(sets[valueIndex].values()), options) + ')';
		}

		if (type === 'A') {
			return (
				'Array.prototype.slice.call(' +
				serialize(
					Object.assign({ length: arrays[valueIndex].length }, arrays[valueIndex]),
					options
				) +
				')'
			);
		}

		if (type === 'U') {
			return 'undefined';
		}

		if (type === 'I') {
			return infinities[valueIndex];
		}

		if (type === 'B') {
			return 'BigInt("' + bigInts[valueIndex] + '")';
		}

		if (type === 'L') {
			return 'new URL("' + urls[valueIndex].toString() + '")';
		}

		let fn = functions[valueIndex];

		return serializeFunc(fn);
	});
}

export default serialize;
