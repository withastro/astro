import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('CSRF origin check', () => {
	let app;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/csrf-check-origin/',
			adapter: testAdapter(),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it("return 403 when the origin doesn't match and calling a POST", async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'multipart/form-data' },
			method: 'POST',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		// case where content-type has different casing
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'MULTIPART/FORM-DATA' },
			method: 'POST',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'application/x-www-form-urlencoded' },
			method: 'POST',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'text/plain' },
			method: 'POST',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: {
				origin: 'http://loreum.com',
				'content-type': 'application/x-www-form-urlencoded; some-other-value',
			},
			method: 'POST',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com' },
			method: 'POST',
			credentials: 'include',
			body: new Blob(['a=b'], {}),
		});
		response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it("return 403 when the origin doesn't match and calling a PUT", async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'multipart/form-data' },
			method: 'PUT',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'application/x-www-form-urlencoded' },
			method: 'PUT',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'text/plain' },
			method: 'PUT',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it("return 403 when the origin doesn't match and calling a DELETE", async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'multipart/form-data' },
			method: 'DELETE',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'application/x-www-form-urlencoded' },
			method: 'DELETE',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'text/plain' },
			method: 'DELETE',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it("return 403 when the origin doesn't match and calling a PATCH", async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'multipart/form-data' },
			method: 'PATCH',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'application/x-www-form-urlencoded' },
			method: 'PATCH',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'text/plain' },
			method: 'PATCH',
		});
		response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it("return a 200 when the origin doesn't match but calling a GET", async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'multipart/form-data' },
			method: 'GET',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			something: 'true',
		});

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'application/x-www-form-urlencoded' },
			method: 'GET',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			something: 'true',
		});

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'text/plain' },
			method: 'GET',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			something: 'true',
		});
	});

	it("return a 200 when the origin doesn't match but calling HEAD", async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'multipart/form-data' },
			method: 'HEAD',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'application/x-www-form-urlencoded' },
			method: 'HEAD',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'text/plain' },
			method: 'HEAD',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it("return a 200 when the origin doesn't match but calling OPTIONS", async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'multipart/form-data' },
			method: 'OPTIONS',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'application/x-www-form-urlencoded' },
			method: 'OPTIONS',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://loreum.com', 'content-type': 'text/plain' },
			method: 'OPTIONS',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('return 200 when calling POST/PUT/DELETE/PATCH with the correct origin', async () => {
		let request;
		let response;
		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://example.com', 'content-type': 'multipart/form-data' },
			method: 'POST',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			something: 'true',
		});

		request = new Request('http://example.com/api/', {
			headers: {
				origin: 'http://example.com',
				'content-type': 'application/x-www-form-urlencoded',
			},
			method: 'PUT',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			something: 'true',
		});

		request = new Request('http://example.com/api/', {
			headers: { origin: 'http://example.com', 'content-type': 'text/plain' },
			method: 'PATCH',
		});
		response = await app.render(request);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			something: 'true',
		});
	});
});

describe('CSRF origin check for Actions', () => {
	let app;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/csrf-check-origin/',
			adapter: testAdapter(),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	// --- RPC endpoint (/_actions/getSecret) ---

	it('blocks cross-origin POST with application/json to RPC action endpoint', async () => {
		const request = new Request('http://example.com/_actions/getSecret', {
			method: 'POST',
			headers: {
				origin: 'http://evil.com',
				'content-type': 'application/json',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it('blocks cross-origin POST with application/x-www-form-urlencoded to RPC action endpoint', async () => {
		const request = new Request('http://example.com/_actions/getSecret', {
			method: 'POST',
			headers: {
				origin: 'http://evil.com',
				'content-type': 'application/x-www-form-urlencoded',
			},
			body: 'foo=bar',
		});
		const response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it('allows same-origin POST with application/json to RPC action endpoint', async () => {
		const request = new Request('http://example.com/_actions/getSecret', {
			method: 'POST',
			headers: {
				origin: 'http://example.com',
				'content-type': 'application/json',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('allows POST without Origin header to RPC action endpoint', async () => {
		const request = new Request('http://example.com/_actions/getSecret', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	// --- Form-style action endpoint (/?_action=getSecret) ---

	it('blocks cross-origin POST with application/json to form-style action endpoint', async () => {
		const request = new Request('http://example.com/?_action=getSecret', {
			method: 'POST',
			headers: {
				origin: 'http://evil.com',
				'content-type': 'application/json',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it('blocks cross-origin POST with application/x-www-form-urlencoded to form-style action endpoint', async () => {
		const request = new Request('http://example.com/?_action=getSecret', {
			method: 'POST',
			headers: {
				origin: 'http://evil.com',
				'content-type': 'application/x-www-form-urlencoded',
			},
			body: 'foo=bar',
		});
		const response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it('allows same-origin POST with application/json to form-style action endpoint', async () => {
		const request = new Request('http://example.com/?_action=getSecret', {
			method: 'POST',
			headers: {
				origin: 'http://example.com',
				'content-type': 'application/json',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('allows POST without Origin header to form-style action endpoint', async () => {
		const request = new Request('http://example.com/?_action=getSecret', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('blocks form-style action when Referer points to a different origin', async () => {
		const request = new Request('http://example.com/?_action=getSecret', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				referer: 'http://evil.com/attack',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 403);
	});

	it('allows form-style action when Referer matches the origin', async () => {
		const request = new Request('http://example.com/?_action=getSecret', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				referer: 'http://example.com/page',
			},
			body: '{}',
		});
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	// --- Non-action endpoints: original behaviour preserved ---

	it('does NOT block cross-origin POST with application/json to a regular (non-action) endpoint', async () => {
		const request = new Request('http://example.com/api/', {
			method: 'POST',
			headers: {
				origin: 'http://evil.com',
				'content-type': 'application/json',
			},
			body: '{}',
		});
		const response = await app.render(request);
		// Regular endpoints with non-form content types are unaffected by the CSRF check
		assert.equal(response.status, 200);
	});

	it('still blocks cross-origin POST with form content-type to a regular (non-action) endpoint', async () => {
		const request = new Request('http://example.com/api/', {
			method: 'POST',
			headers: {
				origin: 'http://evil.com',
				'content-type': 'application/x-www-form-urlencoded',
			},
			body: 'foo=bar',
		});
		const response = await app.render(request);
		assert.equal(response.status, 403);
	});
});
