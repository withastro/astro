import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { routeGuardMiddleware } from '../../../dist/vite-plugin-astro-server/route-guard.js';
import { createBasicSettings, createFixture, createRequestAndResponse } from '../test-utils.ts';

describe('routeGuardMiddleware — filesystem resolution', () => {
	let fixture: Awaited<ReturnType<typeof createFixture>>;

	after(async () => {
		await fixture?.rm();
	});

	it('allows src/ files through on browser navigation (Accept: text/html)', async () => {
		fixture = await createFixture({
			'src/downloads/a.pdf': '%PDF-1.4 test',
		});
		const settings = await createBasicSettings({ root: fixture.path });
		const middleware = routeGuardMiddleware(settings);

		// Simulate browser navigation to /src/downloads/a.pdf
		const { req, res } = createRequestAndResponse({
			method: 'GET',
			url: '/src/downloads/a.pdf',
			headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
		});

		let nextCalled = false;
		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.equal(nextCalled, true, 'next() should be called — file is inside srcDir');
		assert.notEqual((res as any).statusCode, 404, 'should not return 404 for files inside srcDir');
	});

	it('blocks root-level files outside srcDir/publicDir', async () => {
		fixture = await createFixture({
			'README.md': '# Test',
			'src/pages/index.astro': '',
		});
		const settings = await createBasicSettings({ root: fixture.path });
		const middleware = routeGuardMiddleware(settings);

		const { req, res } = createRequestAndResponse({
			method: 'GET',
			url: '/README.md',
			headers: { accept: 'text/html' },
		});

		let nextCalled = false;
		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.equal(nextCalled, false, 'next() should NOT be called — file is at root');
		assert.equal((res as any).statusCode, 404, 'should return 404 for root-level files');
	});
});
