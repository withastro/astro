/*
	shorthash
	(c) 2013 Bibig
	
	https://github.com/bibig/node-shorthash
	shorthash may be freely distributed under the MIT license.
*/

// refer to: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function bitwise(str: string) {
	let hash = 0;
	if (str.length === 0) return hash;
	for (let i = 0; i < str.length; i++) {
		let ch = str.charCodeAt(i);
		hash = (hash << 5) - hash + ch;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

function binaryTransfer(integer: number) {
	const binary = 61;
	const dictionary = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY';

	let stack: string[] = [];
	let num: number;
	let result = '';
	let sign = integer < 0 ? '-' : '';

	integer = Math.abs(integer);

	while (integer >= binary) {
		num = integer % binary;
		integer = Math.floor(integer / binary);
		stack.push(dictionary[num]);
	}

	if (integer > 0) {
		stack.push(dictionary[integer]);
	}

	for (let i = stack.length - 1; i >= 0; i--) {
		result += stack[i];
	}

	return sign + result;
}

/**
 * why choose 61 binary, because we need the last element char to replace the minus sign
 * eg: -aGtzd will be ZaGtzd
 */
export function shorthash(text: string) {
	const id = binaryTransfer(bitwise(text));
	return id.replace('-', 'Z');
}
