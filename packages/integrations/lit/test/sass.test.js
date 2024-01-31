import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

describe('check', () => {
	it('should be able to load sass', async () => {
		let error = null;
		try {
			await import(new URL('../server-shim.js', import.meta.url));
			await import('sass');
		} catch (e) {
			error = e;
		}
		assert.equal(error, null);
	});
});
