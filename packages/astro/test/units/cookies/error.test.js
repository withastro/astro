import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroCookies } from '../../../dist/core/cookies/index.js';

describe('astro/src/core/cookies', () => {
	describe('errors', () => {
		it('Produces an error if the response is already sent', () => {
			const req = new Request('http://example.com/', {});
			const cookies = new AstroCookies(req);
			req[Symbol.for('astro.responseSent')] = true;
			try {
				cookies.set('foo', 'bar');
				assert.equal(false, true);
			} catch (err) {
				assert.equal(err.name, 'ResponseSentError');
			}
		});
	});
});
