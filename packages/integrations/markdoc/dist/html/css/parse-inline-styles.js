/**
 * @license MIT
 *
 * (The MIT License)
 *
 * Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const COMMENT_REGEX = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;
const NEWLINE_REGEX = /\n/g;
const WHITESPACE_REGEX = /^\s*/;
const PROPERTY_REGEX = /^([-#/*\\\w]+(\[[\da-z_-]+\])?)\s*/;
const COLON_REGEX = /^:\s*/;
const VALUE_REGEX = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*\)|[^};])+)/;
const SEMICOLON_REGEX = /^[;\s]*/;
const TRIM_REGEX = /^\s+|\s+$/g;
const NEWLINE = '\n';
const FORWARD_SLASH = '/';
const ASTERISK = '*';
const EMPTY_STRING = '';
const TYPE_COMMENT = 'comment';
const TYPE_DECLARATION = 'declaration';
function parseInlineStyles(style, options) {
	if (typeof style !== 'string') {
		throw new TypeError('First argument must be a string');
	}
	if (!style) return [];
	options = options || {};
	let lineno = 1;
	let column = 1;
	function updatePosition(str) {
		let lines = str.match(NEWLINE_REGEX);
		if (lines) lineno += lines.length;
		let i = str.lastIndexOf(NEWLINE);
		column = ~i ? str.length - i : column + str.length;
	}
	function position() {
		let start = { line: lineno, column };
		return function (node) {
			node.position = new Position(start);
			whitespace();
			return node;
		};
	}
	function Position(start) {
		this.start = start;
		this.end = { line: lineno, column };
		this.source = options.source;
	}
	Position.prototype.content = style;
	const errorsList = [];
	function error(msg) {
		const err = new Error(options.source + ':' + lineno + ':' + column + ': ' + msg);
		err.reason = msg;
		err.filename = options.source;
		err.line = lineno;
		err.column = column;
		err.source = style;
		if (options.silent) {
			errorsList.push(err);
		} else {
			throw err;
		}
	}
	function match(re) {
		const m = re.exec(style);
		if (!m) return;
		const str = m[0];
		updatePosition(str);
		style = style.slice(str.length);
		return m;
	}
	function whitespace() {
		match(WHITESPACE_REGEX);
	}
	function comments(rules) {
		let c;
		rules = rules || [];
		while ((c = comment())) {
			if (c !== false) {
				rules.push(c);
			}
		}
		return rules;
	}
	function comment() {
		const pos = position();
		if (FORWARD_SLASH !== style.charAt(0) || ASTERISK !== style.charAt(1)) return;
		let i = 2;
		while (
			EMPTY_STRING !== style.charAt(i) &&
			(ASTERISK !== style.charAt(i) || FORWARD_SLASH !== style.charAt(i + 1))
		) {
			++i;
		}
		i += 2;
		if (EMPTY_STRING === style.charAt(i - 1)) {
			return error('End of comment missing');
		}
		const str = style.slice(2, i - 2);
		column += 2;
		updatePosition(str);
		style = style.slice(i);
		column += 2;
		return pos({
			type: TYPE_COMMENT,
			comment: str,
		});
	}
	function declaration() {
		const pos = position();
		const prop = match(PROPERTY_REGEX);
		if (!prop) return;
		comment();
		if (!match(COLON_REGEX)) return error("property missing ':'");
		const val = match(VALUE_REGEX);
		const ret = pos({
			type: TYPE_DECLARATION,
			property: trim(prop[0].replace(COMMENT_REGEX, EMPTY_STRING)),
			value: val ? trim(val[0].replace(COMMENT_REGEX, EMPTY_STRING)) : EMPTY_STRING,
		});
		match(SEMICOLON_REGEX);
		return ret;
	}
	function declarations() {
		const decls = [];
		comments(decls);
		let decl;
		while ((decl = declaration())) {
			if (decl !== false) {
				decls.push(decl);
				comments(decls);
			}
		}
		return decls;
	}
	whitespace();
	return declarations();
}
function trim(str) {
	return str ? str.replace(TRIM_REGEX, EMPTY_STRING) : EMPTY_STRING;
}
export { parseInlineStyles };
