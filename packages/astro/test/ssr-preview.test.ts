import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('SSR Preview', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-preview/',
			output: 'server',
			adapter: testAdapter({ extendAdapter: { previewEntrypoint: './preview.mjs' } }),
			outDir: './dist/ssr-preview/',
		});
		await fixture.build();
	});

	it('preview server works', async () => {
		const previewServer = await fixture.preview();
		await previewServer.stop();
	});
});
