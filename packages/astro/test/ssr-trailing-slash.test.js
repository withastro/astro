import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Redirecting trailing slashes in SSR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	describe('trailingSlash: always', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-response/',
				adapter: testAdapter(),
				output: 'server',
				trailingSlash: 'always',
			});
			await fixture.build();
		});
		it('Redirects to add a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Redirects to collapse multiple trailing slashes with query param', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///?hello=world');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/?hello=world');
		});

		it('Does not redirect to collapse multiple internal slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///path/');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does not redirect trailing slashes on query params', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/?hello=world///');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect when trailing slash is present', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects with query params', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/?foo=bar');
		});

		it('Does not redirect with query params when trailing slash is present', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects subdirectories to add a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/sub/path');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/sub/path/');
		});

		it('Does not redirect requests for files', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/favicon.ico');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does not redirect requests for files in subdirectories', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/sub/favicon.ico');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does redirect if the dot is in a directory name', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/dot.in.directory/path');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/dot.in.directory/path/');
		});

		it('Does not redirect internal paths', async () => {
			const app = await fixture.loadTestAdapterApp();

			for (const path of [
				'/_astro/something',
				'/_image?url=http://example.com/foo.jpg',
				'/_server-islands/foo',
				'/_actions/foo',
				'/.netlify/image?url=http://example.com/foo.jpg',
				'//target.example/path',
			]) {
				const request = new Request(`http://example.com${path}`);
				const response = await app.render(request);
				assert.notEqual(response.status, 301);
			}
		});

		it('Redirects POST requests', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another', { method: 'POST' });
			const response = await app.render(request);
			assert.equal(response.status, 308);
			assert.equal(response.headers.get('Location'), '/another/');
		});
	});

	describe('trailingSlash: never', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-response/',
				adapter: testAdapter(),
				output: 'server',
				trailingSlash: 'never',
			});
			await fixture.build();
		});

		it('Redirects to remove a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another');
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another');
		});

		it('Does not redirect when trailing slash is absent', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects with query params', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another?foo=bar');
		});

		it('Does not redirect with query params when trailing slash is absent', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it("Does not redirect when there's a slash at the end of query params", async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another?foo=bar/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects subdirectories to remove a trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/sub/path/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/sub/path');
		});

		it("Redirects even if there's a dot in the directory name", async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/favicon.ico/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/favicon.ico');
		});

		it('Does not redirect internal paths', async () => {
			const app = await fixture.loadTestAdapterApp();

			for (const path of [
				'/_astro/something/',
				'/_image/?url=http://example.com/foo.jpg',
				'/_server-islands/foo/',
				'/_actions/foo/',
				'/.netlify/image/?url=http://example.com/foo.jpg',
				'//target.example/path/',
			]) {
				const request = new Request(`http://example.com${path}/`);
				const response = await app.render(request);
				assert.notEqual(response.status, 301);
			}
		});

		it('Redirects POST requests', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/', { method: 'POST' });
			const response = await app.render(request);
			assert.equal(response.status, 308);
			assert.equal(response.headers.get('Location'), '/another');
		});
	});

	describe('trailingSlash: never with base path', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-response/',
				adapter: testAdapter(),
				output: 'server',
				trailingSlash: 'never',
				base: '/mybase',
			});
			await fixture.build();
		});

		it('Redirects to remove a trailing slash on base path', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/mybase');
		});

		it('Does not redirect when base path has no trailing slash', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase');
			const response = await app.render(request);
			// Should not redirect, but will 404 since we don't have an index page
			assert.notEqual(response.status, 301);
			assert.notEqual(response.status, 308);
		});

		it('Redirects to remove trailing slash on sub-paths with base', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase/another/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/mybase/another');
		});

		it('Does not redirect sub-paths without trailing slash with base', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/mybase/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	describe('trailingSlash: ignore', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-response/',
				adapter: testAdapter(),
				output: 'server',
				trailingSlash: 'ignore',
			});
			await fixture.build();
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Does not redirect when trailing slash is absent', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect when trailing slash is present', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect internal paths', async () => {
			const app = await fixture.loadTestAdapterApp();

			for (const path of [
				'/_astro/something//',
				'/_image//?url=http://example.com/foo.jpg',
				'/_server-islands/foo//',
				'/_actions/foo//',
				'/.netlify/image//?url=http://example.com/foo.jpg',
				'//target.example/path//',
			]) {
				const request = new Request(`http://example.com${path}/`);
				const response = await app.render(request);
				assert.notEqual(response.status, 301);
			}
		});
	});
});
