import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createContext } from '../../../dist/core/middleware/index.js';

describe('createAPIContext', () => {
	it('should return the clientAddress', () => {
		const request = new Request('http://example.com', {
			headers: {
				'x-forwarded-for': '192.0.2.43, 172.16.58.3',
			},
		});

		const context = createContext({
			request,
		});

		assert.equal(context.clientAddress, '192.0.2.43');
	});
});
