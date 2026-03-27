import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createContext } from '../../../dist/core/middleware/index.js';

declare global {
	namespace App {
		interface Locals {
			foo?: string;
		}
	}
}

describe('createAPIContext', () => {
	it('should return the clientAddress when explicitly provided', () => {
		const request = new Request('http://example.com');

		const context = createContext({
			request,
			clientAddress: '192.0.2.43',
			defaultLocale: 'en',
		});

		assert.equal(context.clientAddress, '192.0.2.43');
	});

	it('should throw when clientAddress is not provided', () => {
		const request = new Request('http://example.com');

		const context = createContext({
			request,
			defaultLocale: 'en',
		});

		assert.throws(
			() => context.clientAddress,
			(err: Error) => {
				assert.equal(err.name, 'StaticClientAddressNotAvailable');
				return true;
			},
		);
	});

	it('should not read clientAddress from x-forwarded-for header', () => {
		const request = new Request('http://example.com', {
			headers: {
				'x-forwarded-for': '192.0.2.43, 172.16.58.3',
			},
		});

		const context = createContext({
			request,
			defaultLocale: 'en',
		});

		assert.throws(
			() => context.clientAddress,
			(err: Error) => {
				assert.equal(err.name, 'StaticClientAddressNotAvailable');
				return true;
			},
		);
	});

	it('should return the correct locals', () => {
		const request = new Request('http://example.com');

		const context = createContext({
			request,
			defaultLocale: 'en',
			locals: {
				foo: 'bar',
			},
		});

		assert.deepEqual(context.locals, { foo: 'bar' });
	});
});
