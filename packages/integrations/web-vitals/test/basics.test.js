// @ts-check

import * as assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from './test-utils.js';

/**
 * @template {Record<K, (...args: any[]) => void>} T
 * @template {keyof T} K
 */
class MockFunction {
	/** @type {Parameters<T[K]>[]} */
	calls = [];

	/**
	 * @param {T} object
	 * @param {K} property
	 */
	constructor(object, property) {
		this.object = object;
		this.property = property;
		this.original = object[property];
		object[property] = /** @param {Parameters<T[K]>} args */ (...args) => {
			this.calls.push(args);
		};
	}
	restore() {
		this.object[this.property] = this.original;
	}
	reset() {
		this.calls = [];
	}
}

describe('Web Vitals integration basics', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;
	/** @type {MockFunction<Console, 'error'>} */
	let consoleErrorMock;

	before(async () => {
		consoleErrorMock = new MockFunction(console, 'error');
		fixture = await loadFixture({ root: './fixtures/basics/' });
		devServer = await fixture.startDevServer({});
	});

	after(async () => {
		consoleErrorMock.restore();
		await devServer.stop();
	});

	beforeEach(() => {
		consoleErrorMock.reset();
	});

	it('adds a meta tag to the page', async () => {
		const html = await fixture.fetch('/', {}).then((res) => res.text());
		const { document } = parseHTML(html);
		const meta = document.querySelector('head > meta[name="x-astro-vitals-route"]');
		assert.ok(meta);
		assert.equal(meta.getAttribute('content'), '/');
	});

	it('adds a meta tag using the route pattern to the page', async () => {
		const html = await fixture.fetch('/test', {}).then((res) => res.text());
		const { document } = parseHTML(html);
		const meta = document.querySelector('head > meta[name="x-astro-vitals-route"]');
		assert.ok(meta);
		assert.equal(meta.getAttribute('content'), '/[dynamic]');
	});

	it('returns a 200 response even when bad data is sent to the injected endpoint', async () => {
		{
			// bad data
			const res = await fixture.fetch('/_web-vitals', { method: 'POST', body: 'garbage' });
			assert.equal(res.status, 200);
		}
		{
			// no data
			const res = await fixture.fetch('/_web-vitals', { method: 'POST', body: '[]' });
			assert.equal(res.status, 200);
		}
		assert.equal(consoleErrorMock.calls.length, 2);
	});

	it('validates data sent to the injected endpoint with Zod', async () => {
		const res = await fixture.fetch('/_web-vitals', { method: 'POST', body: '[{}]' });
		assert.equal(res.status, 200);
		const call = consoleErrorMock.calls[0][0];
		assert.ok(call instanceof Error);
		assert.equal(call.name, 'ZodError');
	});

	it('inserts data via the injected endpoint', async () => {
		const res = await fixture.fetch('/_web-vitals', {
			method: 'POST',
			body: JSON.stringify([
				{
					pathname: '/',
					route: '/',
					name: 'CLS',
					id: 'v3-1711484350895-3748043125387',
					value: 0,
					rating: 'good',
				},
			]),
		});
		assert.equal(res.status, 200);
		assert.equal(
			consoleErrorMock.calls.length,
			0,
			'Endpoint logged errors:\n' + consoleErrorMock.calls[0]?.join(' ')
		);
	});
});
