/**
 * correctPath.js <https://github.com/streamich/fs-monkey/blob/af36a890d8070b25b9eae7178824f653bad5621f/src/correctPath.js>
 * Taken from:
 * https://github.com/streamich/fs-monkeys
 */

const isWin = process.platform === 'win32';

/*!
 * removeTrailingSeparator <https://github.com/darsain/remove-trailing-separator>
 *
 * Inlined from:
 * Copyright (c) darsain.
 * Released under the ISC License.
 */
function removeTrailingSeparator(str) {
	let i = str.length - 1;
	if (i < 2) {
		return str;
	}
	while (isSeparator(str, i)) {
		i--;
	}
	return str.substr(0, i + 1);
}

function isSeparator(str, i) {
	let char = str[i];
	return i > 0 && (char === '/' || (isWin && char === '\\'));
}

/*!
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Inlined from:
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
function normalizePath(str, stripTrailing) {
	if (typeof str !== 'string') {
		throw new TypeError('expected a string');
	}
	str = str.replace(/[\\/]+/g, '/');
	if (stripTrailing !== false) {
		str = removeTrailingSeparator(str);
	}
	return str;
}

/*!
 * unixify <https://github.com/jonschlinkert/unixify>
 *
 * Inlined from:
 * Copyright (c) 2014, 2017, Jon Schlinkert.
 * Released under the MIT License.
 */
export function unixify(filepath, stripTrailing = true) {
	if (isWin) {
		filepath = normalizePath(filepath, stripTrailing);
		return filepath.replace(/^([a-zA-Z]+:|\.\/)/, '');
	}
	return filepath;
}

/*
 * Corrects a windows path to unix format (including \\?\c:...)
 */
export function correctPath(filepath) {
	return unixify(filepath.replace(/^\\\\\?\\.:\\/, '\\'));
}
