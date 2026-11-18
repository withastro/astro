import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Error page cookies', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/error-page-cookies/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('preserves cookies from the 500 error page when original page throws', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 500);

		const setCookieHeaders = response.headers.getSetCookie();
		const hasFlash = setCookieHeaders.some((c) => c.includes('flash=boom'));
		assert.ok(hasFlash, `Expected flash=boom cookie, got: ${JSON.stringify(setCookieHeaders)}`);
	});

	it('preserves cookies from the 500 error page when no original cookies exist', async () => {
		const request = new Request('http://example.com/only-error-cookie');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 500);

		const setCookieHeaders = response.headers.getSetCookie();
		const hasFlash = setCookieHeaders.some((c) => c.includes('flash=boom'));
		assert.ok(hasFlash, `Expected flash=boom cookie, got: ${JSON.stringify(setCookieHeaders)}`);
	});

	it('preserves cookies from both middleware and the 404 error page', async () => {
		const request = new Request('http://example.com/does-not-exist');
		const response = await app.render(request, { addCookieHeader: true });

		assert.equal(response.status, 404);

		const setCookieHeaders = response.headers.getSetCookie();
		const hasSid = setCookieHeaders.some((c) => c.includes('sid=abc'));
		const hasNotFound = setCookieHeaders.some((c) => c.includes('not_found=true'));

		assert.ok(hasSid, `Expected sid=abc cookie, got: ${JSON.stringify(setCookieHeaders)}`);
		assert.ok(
			hasNotFound,
			`Expected not_found=true cookie, got: ${JSON.stringify(setCookieHeaders)}`,
		);
	});
});
