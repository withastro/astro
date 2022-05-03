/*
	Based on the code of Bibig
	https://github.com/bibig/node-shorthash
*/

const dictionary = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY';
const binary = dictionary.length;

// refer to: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function bitwise(str: string) {
	let hash = 0;
	if (str.length === 0) return hash;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		hash = (hash << 5) - hash + ch;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

export function shorthash(text: string) {
	let num: number;
	let result = '';

	let integer = bitwise(text);
	const sign = integer < 0 ? 'Z' : ''; // It it's negative, start with Z, which isn't in the dictionary

	integer = Math.abs(integer);

	while (integer >= binary) {
		num = integer % binary;
		integer = Math.floor(integer / binary);
		result = dictionary[num] + result;
	}

	if (integer > 0) {
		result = dictionary[integer] + result;
	}

	return sign + result;
}
