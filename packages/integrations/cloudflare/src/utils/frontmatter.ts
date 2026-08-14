// Matches a top-level `return`, sticky so it can be tested at a known offset.
// Negative lookbehind `(?<!\.)` prevents matching member accesses like `gen.return()`.
const RETURN_RE = /(?<!\.)\breturn(\s*;|\b)/y;

// A `/` only starts a regex literal where an expression is expected, which the
// preceding token tells us: an operator, an opening bracket, or a keyword.
const REGEX_ALLOWED_BEFORE_RE =
	/(?:[([{,;:=!&|?+\-*%~^<>]|\b(?:return|typeof|instanceof|in|of|new|delete|void|case|do|else|yield|await))$/;

function skipQuoted(code: string, start: number): number {
	const quote = code[start];
	let index = start + 1;
	while (index < code.length) {
		const char = code[index];
		if (char === '\\') {
			index += 2;
			continue;
		}
		if (char === quote) return index + 1;
		index++;
	}
	return code.length;
}

function skipComment(code: string, start: number): number {
	if (code[start + 1] === '/') {
		const end = code.indexOf('\n', start);
		return end === -1 ? code.length : end;
	}
	const end = code.indexOf('*/', start + 2);
	return end === -1 ? code.length : end + 2;
}

function skipRegexLiteral(code: string, start: number): number {
	let index = start + 1;
	let inCharacterClass = false;
	while (index < code.length) {
		const char = code[index];
		if (char === '\\') {
			index += 2;
			continue;
		}
		// An unterminated literal means the `/` was not one, so treat it as a plain character.
		if (char === '\n') return start + 1;
		if (char === '[') inCharacterClass = true;
		else if (char === ']') inCharacterClass = false;
		else if (char === '/' && !inCharacterClass) return index + 1;
		index++;
	}
	return start + 1;
}

function startsRegexLiteral(code: string, start: number): boolean {
	const before = code.slice(0, start).trimEnd();
	return before === '' || REGEX_ALLOWED_BEFORE_RE.test(before);
}

/**
 * Rewrites top-level `return` statements in .astro frontmatter to `throw`, which
 * esbuild and Rolldown accept inside an ECMAScript module during the dependency scan.
 *
 * Scans character by character so that `return` inside a string, template literal,
 * comment or regex literal is left alone.
 */
export function replaceTopLevelReturns(code: string): string {
	let result = '';
	let index = 0;
	while (index < code.length) {
		const char = code[index];
		let end = index;
		if (char === '"' || char === "'" || char === '`') {
			end = skipQuoted(code, index);
		} else if (char === '/' && (code[index + 1] === '/' || code[index + 1] === '*')) {
			end = skipComment(code, index);
		} else if (char === '/' && startsRegexLiteral(code, index)) {
			end = skipRegexLiteral(code, index);
		} else if (char === 'r') {
			RETURN_RE.lastIndex = index;
			const match = RETURN_RE.exec(code);
			if (match) {
				result += match[1].trim() === ';' ? 'throw 0;' : 'throw ';
				index += match[0].length;
				continue;
			}
		}
		if (end > index) {
			result += code.slice(index, end);
			index = end;
			continue;
		}
		result += char;
		index++;
	}
	return result;
}
