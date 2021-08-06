'use strict';

import stripBom from 'strip-bom-string';
import typeOf from 'kind-of';

export function define(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: val,
  });
}

/**
 * Returns true if `val` is a buffer
 */

export function isBuffer(val) {
  return typeOf(val) === 'buffer';
}

/**
 * Returns true if `val` is an object
 */

export function isObject(val) {
  return typeOf(val) === 'object';
}

/**
 * Cast `input` to a buffer
 */

export function toBuffer(input) {
  return typeof input === 'string' ? Buffer.from(input) : input;
}

/**
 * Cast `val` to a string.
 */

export function toString(input) {
  if (isBuffer(input)) return stripBom(String(input));
  if (typeof input !== 'string') {
    throw new TypeError('expected input to be a string or buffer');
  }
  return stripBom(input);
}

/**
 * Cast `val` to an array.
 */

export function arrayify(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
}

/**
 * Returns true if `str` starts with `substr`.
 */

export function startsWith(str, substr, len) {
  if (typeof len !== 'number') len = substr.length;
  return str.slice(0, len) === substr;
}
