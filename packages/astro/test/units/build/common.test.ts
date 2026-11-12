import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getUrlForPath } from '../../../dist/core/build/common.js';
import { validateAndDecodePathname } from '../../../dist/core/util/pathname.js';

const origin = 'http://localhost:4321';

describe('getUrlForPath', () => {
	for (const [pathname, format, expected] of [
		['/50%-off', 'directory', '/50%-off/'],
		['/50%-off', 'file', '/50%-off.html'],
		['/a\\b', 'directory', '/a\\b/'],
		['/tag%231', 'directory', '/tag%231/'],
	] as const) {
		it(`builds a request URL that decodes back to \`${pathname}\` (${format})`, () => {
			const url = getUrlForPath(pathname, '/', origin, format, 'ignore', 'page', false);
			assert.equal(validateAndDecodePathname(url.pathname), expected);
		});
	}
});
