// @ts-nocheck
// https://github.com/remarkablemark/style-to-object

/**
 * @license MIT
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Menglin "Mark" Xu <mark@remarkablemark.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { parseInlineStyles } from './parse-inline-styles.js';

/**
 * Parses inline style to object.
 *
 * @example
 * // returns { 'line-height': '42' }
 * styleToObject('line-height: 42;');
 *
 * @param  {String}      style      - The inline style.
 * @param  {Function}    [iterator] - The iterator function.
 * @return {null|Object}
 */
export function styleToObject(style, iterator) {
	let output = null;
	if (!style || typeof style !== 'string') {
		return output;
	}

	let declaration;
	let declarations = parseInlineStyles(style);
	let hasIterator = typeof iterator === 'function';
	let property;
	let value;

	for (let i = 0, len = declarations.length; i < len; i++) {
		declaration = declarations[i];
		property = declaration.property;
		value = declaration.value;

		if (hasIterator) {
			iterator(property, value, declaration);
		} else if (value) {
			output || (output = {});
			output[property] = value;
		}
	}

	return output;
}
