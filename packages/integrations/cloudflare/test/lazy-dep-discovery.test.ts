import * as assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { AstroLogger, type AstroLoggerMessage } from '../../../astro/dist/core/logger/core.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// ref: https://github.com/withastro/astro/issues/17364
// When the SSR dep optimizer discovers a new dependency mid-session (here: a new island
// importing `use-sync-external-store`, added while the dev server is running), the
// re-optimization renames optimized dep URLs. Stale modules in the workerd module runner
// then hold a second React copy, breaking hooks with "Invalid hook call" — unless outdated
// requests are allowed to fail fast (`ignoreOutdatedRequests: false`) so rendering retries
// against the new bundle.
describe('Lazy dependency discovery mid-session', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	const logs: AstroLoggerMessage[] = [];
	const newFiles: string[] = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/lazy-dep-discovery/',
		});

		// Start from a cold Vite cache so the optimizer state matches a fresh session.
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		devServer = await fixture.startDevServer({
			vite: { logLevel: 'info' },
			// @ts-expect-error use of internal APIs
			_logger: new AstroLogger({
				level: 'info',
				destination: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			}),
		});
	});

	after(async () => {
		await devServer.stop();
		for (const file of newFiles) {
			rmSync(file, { force: true });
		}
	});

	it('does not corrupt React after a new island triggers dep re-optimization', async () => {
		// Warm the session: the pre-existing island renders fine.
		const baseline = await fixture.fetch('/');
		assert.equal(baseline.status, 200);
		const $baseline = cheerio.load(await baseline.text());
		assert.match($baseline('.react').text(), /React Content/);

		// Simulate the user adding new files during the live session. The new island
		// imports a React-dependent package that is not part of the pre-optimized set,
		// which forces mid-session dependency discovery on the next request.
		const componentPath = fileURLToPath(
			new URL('./src/components/LazyComp.tsx', fixture.config.root),
		);
		const pagePath = fileURLToPath(new URL('./src/pages/lazy.astro', fixture.config.root));
		mkdirSync(fileURLToPath(new URL('./src/components/', fixture.config.root)), {
			recursive: true,
		});
		writeFileSync(
			componentPath,
			`import { useSyncExternalStore } from 'use-sync-external-store/shim';
const subscribe = () => () => {};
const getSnapshot = () => 'snapshot';
export const LazyComp = () => {
	const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	return <div className="lazy">Lazy: {value}</div>;
};
`,
		);
		writeFileSync(
			pagePath,
			`---
import { LazyComp } from '../components/LazyComp';
import { Component } from '../components/Component';
---
<html>
<head><title>Lazy</title></head>
<body>
<LazyComp client:load />
<Component client:load />
</body>
</html>
`,
		);
		newFiles.push(componentPath, pagePath);

		// Poll the new page. Transient non-200 responses are allowed while the route is
		// registered and while an in-flight request races the re-optimization (that race
		// is expected to fail fast and recover). What must never happen is a 200 that is
		// missing the island markup: that is the dual-React corruption signature.
		let sawHealthyResponse = false;
		for (let attempt = 0; attempt < 30 && !sawHealthyResponse; attempt++) {
			const res = await fixture.fetch('/lazy');
			if (res.status === 200) {
				const $ = cheerio.load(await res.text());
				assert.match(
					$('.lazy').text(),
					/Lazy: snapshot/,
					'a 200 response must contain the new island markup',
				);
				assert.match(
					$('.react').text(),
					/React Content/,
					'a 200 response must contain the pre-existing island markup',
				);
				sawHealthyResponse = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}
		assert.ok(sawHealthyResponse, 'the new page must eventually render successfully');

		// The pre-existing page must still render.
		const index = await fixture.fetch('/');
		assert.equal(index.status, 200);
		const $index = cheerio.load(await index.text());
		assert.match($index('.react').text(), /React Content/);

		// And at no point may React have been split into two instances.
		const invalidHookLog = logs.find((log) => log.message?.includes('Invalid hook call'));
		assert.equal(
			invalidHookLog,
			undefined,
			`React was instantiated twice during re-optimization: ${invalidHookLog?.message}`,
		);
	});
});
