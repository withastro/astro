import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchesIfNoneMatch } from '../dist/utils/etag.js';

describe('If-None-Match', () => {
	for (const [value, etag, expected] of [
		[null, '"abc"', false],
		['', '"abc"', false],
		['"abc"', '"abc"', true],
		['W/"abc"', '"abc"', true],
		['"abc"', 'W/"abc"', true],
		['W/"abc"', 'W/"abc"', true],
		['"other", W/"abc", "last"', '"abc"', true],
		[' \t"other" ,\t "abc" \t', '"abc"', true],
		[', , "abc", ,', '"abc"', true],
		['*', '"abc"', true],
		[' * ', null, true],
		['"other"', '"abc"', false],
		['"ABC"', '"abc"', false],
		['"abc"', null, false],
		['"a,b", "abc"', '"a,b"', true],
		['"a,b"', '"b"', false],
		['""', '""', true],
		['"abc" invalid', '"abc"', false],
		['abc', '"abc"', false],
		['w/"abc"', '"abc"', false],
		['"abc" "other"', '"abc"', false],
		['*, "abc"', '"abc"', false],
		['"unterminated', '"abc"', false],
		['"ab c"', '"ab c"', false],
	] as const) {
		it(`${JSON.stringify(value)} against ${JSON.stringify(etag)} => ${expected}`, () => {
			assert.equal(matchesIfNoneMatch(value, etag), expected);
		});
	}
});
