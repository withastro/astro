// @ts-nocheck
// taken from MIT Licensed lib: https://github.com/remarkablemark/style-to-object

import { parseInlineStyles } from "./parse-inline-styles.js";

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
