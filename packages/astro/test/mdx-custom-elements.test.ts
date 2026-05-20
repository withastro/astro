import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('MDX custom elements — with renderer (issue #16273)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/mdx-custom-elements/' });
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('invokes the renderer for <my-element> in an .mdx file', async () => {
			const $ = cheerio.load(await fixture.readFile('/mdx/index.html'));
			assert.equal($('my-element[data-ssr="true"]').length, 1);
		});
	});

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('invokes the renderer for <my-element> in an .mdx file', async () => {
			const res = await fixture.fetch('/mdx');
			assert.equal(res.status, 200);
			assert.equal(
				cheerio.load(await res.text())('my-element[data-ssr="true"]').length,
				1,
			);
		});
	});
});

describe('MDX custom elements — no renderer fallback', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/mdx-custom-elements-no-renderer/' });
		await fixture.build();
	});

	it('renders <my-element> as plain HTML when no renderer is registered', async () => {
		const $ = cheerio.load(await fixture.readFile('/mdx/index.html'));
		assert.ok($('my-element').length > 0);
		assert.equal($('my-element[data-ssr]').length, 0);
	});
});
