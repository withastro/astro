import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getUrlForPath } from '../../../dist/core/build/common.js';
import { validateAndDecodePathname } from '../../../dist/core/util/pathname.js';

describe('getUrlForPath', () => {
	const origin = 'http://localhost:4321';

	it('encodes a literal % so the request path decodes back to the param value', () => {
		const url = getUrlForPath('/50%-off', '/', origin, 'directory', 'ignore', 'page', false);
		assert.equal(url.pathname, '/50%25-off/');
		assert.equal(validateAndDecodePathname(url.pathname), '/50%-off/');
	});

	it('encodes a literal % for the file build format', () => {
		const url = getUrlForPath('/100%', '/', origin, 'file', 'ignore', 'page', false);
		assert.equal(url.pathname, '/100%25.html');
	});

	it('leaves existing percent-escapes untouched', () => {
		const url = getUrlForPath('/a%23b', '/', origin, 'directory', 'ignore', 'page', false);
		assert.equal(url.pathname, '/a%23b/');
	});
});
