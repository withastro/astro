import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/17995
//
// `virtual:astro:component-metadata` is imported by the dev app entrypoint, so
// invalidating it invalidates that entire import chain and the module runner
// re-evaluates the server graph on the next request. The plugin invalidated the
// module from its own `transform` hook, so evaluating it scheduled the next
// evaluation and every request from then on paid for a full re-evaluation.
describe('Head metadata invalidation in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	async function transformInvalidations() {
		const res = await fixture.fetch('/__transform-invalidations');
		return Number(await res.text());
	}

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/head-metadata-invalidation/',
		});
		devServer = await fixture.startDevServer();
		// Warm the graph: the first requests legitimately invalidate while the
		// page and its layout are compiled for the first time.
		await fixture.fetch('/');
		await fixture.fetch('/');
	});

	after(async () => {
		await devServer?.stop();
	});

	it('stops invalidating the metadata module once the graph is warm', async () => {
		const baseline = await transformInvalidations();
		await fixture.fetch('/');
		await fixture.fetch('/');
		await fixture.fetch('/');
		assert.equal(await transformInvalidations(), baseline);
	});

	it('serves updated head content after a layout edit', async () => {
		await fixture.editFile('./src/layouts/Layout.astro', (content) =>
			content.replace('content="original"', 'content="edited"'),
		);

		const html = await (await fixture.fetch('/')).text();
		assert.match(html, /<meta name="head-marker" content="edited"/);
	});
});
