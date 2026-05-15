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
export declare function styleToObject(style: any, iterator: any): {} | null;
