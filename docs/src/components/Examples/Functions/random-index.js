/**
 * Random Index from Array
 * @param {Number} length - Length of Array
 * @returns Random Index from the Array
 */

const randomIndex = (length) => Math.round(Math.random() * (0-length)) + length - 1

export default randomIndex