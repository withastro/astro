import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild static headers', () => {
	const root = new URL('./fixtures/incremental-build-headers/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;
	let routeToHeaders: Map<string, { headers: Headers }> | undefined;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({
			root,
			output: 'static',
			experimental: {
				incrementalBuild: true,
			},
			security: {
				csp: true,
			},
			adapter: testAdapter({
				staticHeaders: true,
				setRouteToHeaders(payload: Map<string, { headers: Headers }>) {
					routeToHeaders = payload;
				},
			}),
		});
		// Warm the cache.
		await fixture.build();
	});

	it('replays a skipped route into the static headers map', async () => {
		// Sanity: the warm build collected a CSP header for the route.
		assert.ok(routeToHeaders!.has('/page/a'), 'warm build should collect the route header');
		assert.ok(
			routeToHeaders!.get('/page/a')?.headers.has('content-security-policy'),
			'warm build header should include CSP',
		);

		// The header was persisted so it can be replayed on skip.
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const pathEntry = cache.routes['src/pages/page/[slug].astro'].paths['/page/a'];
		assert.ok(pathEntry.headers?.length > 0, 'the path should record its response headers');

		// Rebuild with no changes: the route is skipped rather than re-rendered, so
		// it never sets a header. Without replay it would be dropped from the map.
		routeToHeaders = undefined;
		await fixture.build();

		assert.ok(routeToHeaders!.has('/page/a'), 'skipped route should still be in the headers map');
		assert.ok(
			routeToHeaders!.get('/page/a')?.headers.has('content-security-policy'),
			'replayed header should include CSP',
		);
	});
});
