import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Dev CSS collection stops at page boundaries', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		// virtual:astro:pages only lists on-demand pages in the SSR environment, so the
		// leak from #18060 needs server output to reproduce.
		fixture = await loadFixture({
			root: './fixtures/dev-css-page-boundary/',
			output: 'server',
			adapter: testAdapter(),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('does not include CSS from other pages when a page imports astro:config/server', async () => {
		const html = await fixture.fetch('/').then((res) => res.text());
		assert.match(html, /rgb\(1, 2, 3\)/);
		assert.doesNotMatch(html, /rgb\(4, 5, 6\)/);
	});

	it('keeps the CSS of the other page on that page', async () => {
		const html = await fixture.fetch('/b').then((res) => res.text());
		assert.match(html, /rgb\(4, 5, 6\)/);
		assert.doesNotMatch(html, /rgb\(1, 2, 3\)/);
	});
});
