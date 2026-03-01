import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest } from './test-helpers.js';

function escapeRoute(route) {
	return route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createRouteData(route) {
	const segments = route
		.split('/')
		.filter(Boolean)
		.map((segment) => [{ content: segment, dynamic: false, spread: false }]);

	return {
		route,
		component: `src/pages${route}.astro`,
		params: [],
		pathname: route,
		distURL: [],
		pattern: new RegExp(`^${escapeRoute(route)}\\/?$`),
		segments,
		type: 'page',
		prerender: false,
		fallbackRoutes: [],
		isIndex: false,
		origin: 'project',
	};
}

const okPage = createComponent(() => {
	return render`<h1>Ok</h1>`;
});

const notFoundPage = createComponent(() => {
	return render`<h1>Not Found</h1>`;
});

const anotherRouteData = createRouteData('/another');
const subPathRouteData = createRouteData('/sub/path');
const dotPathRouteData = createRouteData('/dot.in.directory/path');
const notFoundRouteData = {
	...createRouteData('/404'),
	component: 'src/pages/404.astro',
};

const pageMap = new Map([
	[
		anotherRouteData.component,
		async () => ({
			page: async () => ({
				default: okPage,
			}),
		}),
	],
	[
		subPathRouteData.component,
		async () => ({
			page: async () => ({
				default: okPage,
			}),
		}),
	],
	[
		dotPathRouteData.component,
		async () => ({
			page: async () => ({
				default: okPage,
			}),
		}),
	],
	[
		notFoundRouteData.component,
		async () => ({
			page: async () => ({
				default: notFoundPage,
			}),
		}),
	],
]);

describe('Redirecting trailing slashes in SSR', () => {
	describe('trailingSlash: always', () => {
		const app = new App(
			createManifest({
				trailingSlash: 'always',
				routes: [
					{ routeData: anotherRouteData },
					{ routeData: subPathRouteData },
					{ routeData: dotPathRouteData },
					{ routeData: notFoundRouteData },
				],
				pageMap,
			}),
		);

		it('Redirects to add a trailing slash', async () => {
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Redirects to collapse multiple trailing slashes with query param', async () => {
			const request = new Request('http://example.com/another///?hello=world');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/?hello=world');
		});

		it('Does not redirect to collapse multiple internal slashes', async () => {
			const request = new Request('http://example.com/another///path/');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does not redirect trailing slashes on query params', async () => {
			const request = new Request('http://example.com/another/?hello=world///');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect when trailing slash is present', async () => {
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects with query params', async () => {
			const request = new Request('http://example.com/another?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/?foo=bar');
		});

		it('Does not redirect with query params when trailing slash is present', async () => {
			const request = new Request('http://example.com/another/?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects subdirectories to add a trailing slash', async () => {
			const request = new Request('http://example.com/sub/path');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/sub/path/');
		});

		it('Does not redirect requests for files', async () => {
			const request = new Request('http://example.com/favicon.ico');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does not redirect requests for files in subdirectories', async () => {
			const request = new Request('http://example.com/sub/favicon.ico');
			const response = await app.render(request);
			assert.equal(response.status, 404);
		});

		it('Does redirect if the dot is in a directory name', async () => {
			const request = new Request('http://example.com/dot.in.directory/path');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/dot.in.directory/path/');
		});

		it('Does not redirect internal paths', async () => {
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
			const request = new Request('http://example.com/another', { method: 'POST' });
			const response = await app.render(request);
			assert.equal(response.status, 308);
			assert.equal(response.headers.get('Location'), '/another/');
		});
	});

	describe('trailingSlash: never', () => {
		const app = new App(
			createManifest({
				trailingSlash: 'never',
				routes: [
					{ routeData: anotherRouteData },
					{ routeData: subPathRouteData },
					{ routeData: notFoundRouteData },
				],
				pageMap,
			}),
		);

		it('Redirects to remove a trailing slash', async () => {
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another');
		});

		it('Redirects to collapse multiple trailing slashes', async () => {
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another');
		});

		it('Does not redirect when trailing slash is absent', async () => {
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects with query params', async () => {
			const request = new Request('http://example.com/another/?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another?foo=bar');
		});

		it('Does not redirect with query params when trailing slash is absent', async () => {
			const request = new Request('http://example.com/another?foo=bar');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it("Does not redirect when there's a slash at the end of query params", async () => {
			const request = new Request('http://example.com/another?foo=bar/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Redirects subdirectories to remove a trailing slash', async () => {
			const request = new Request('http://example.com/sub/path/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/sub/path');
		});

		it("Redirects even if there's a dot in the directory name", async () => {
			const request = new Request('http://example.com/favicon.ico/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/favicon.ico');
		});

		it('Does not redirect internal paths', async () => {
			for (const path of [
				'/_astro/something/',
				'/_image/?url=http://example.com/foo.jpg',
				'/_server-islands/foo/',
				'/_actions/foo/',
				'/.netlify/image/?url=http://example.com/foo.jpg',
				'//target.example/path/',
			]) {
				const request = new Request(`http://example.com${path}`);
				const response = await app.render(request);
				assert.notEqual(response.status, 301);
			}
		});

		it('Redirects POST requests', async () => {
			const request = new Request('http://example.com/another/', { method: 'POST' });
			const response = await app.render(request);
			assert.equal(response.status, 308);
			assert.equal(response.headers.get('Location'), '/another');
		});
	});

	describe('trailingSlash: never with base path', () => {
		const app = new App(
			createManifest({
				base: '/mybase',
				trailingSlash: 'never',
				routes: [{ routeData: anotherRouteData }, { routeData: notFoundRouteData }],
				pageMap,
			}),
		);

		it('Redirects to remove a trailing slash on base path', async () => {
			const request = new Request('http://example.com/mybase/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/mybase');
		});

		it('Does not redirect when base path has no trailing slash', async () => {
			const request = new Request('http://example.com/mybase');
			const response = await app.render(request);
			assert.notEqual(response.status, 301);
			assert.notEqual(response.status, 308);
		});

		it('Redirects to remove trailing slash on sub-paths with base', async () => {
			const request = new Request('http://example.com/mybase/another/');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/mybase/another');
		});

		it('Does not redirect sub-paths without trailing slash with base', async () => {
			const request = new Request('http://example.com/mybase/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	describe('trailingSlash: ignore', () => {
		const app = new App(
			createManifest({
				trailingSlash: 'ignore',
				routes: [{ routeData: anotherRouteData }, { routeData: notFoundRouteData }],
				pageMap,
			}),
		);

		it('Redirects to collapse multiple trailing slashes', async () => {
			const request = new Request('http://example.com/another///');
			const response = await app.render(request);
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/another/');
		});

		it('Does not redirect when trailing slash is absent', async () => {
			const request = new Request('http://example.com/another');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect when trailing slash is present', async () => {
			const request = new Request('http://example.com/another/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});

		it('Does not redirect internal paths', async () => {
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
