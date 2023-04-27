import { loadFixture } from './test-utils.js';
import testAdapter from '../dist/testing/ssr-adapter.js';

describe('SSR Preview', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/ssr-preview/', import.meta.url),
			output: 'server',
			adapter: testAdapter({ extendAdapter: { previewEntrypoint: './preview.mjs' } }),
		});
		await fixture.build();
	});

	it('preview server works', async () => {
		/** @type {import('./test-utils').PreviewServer} */
		const previewServer = await fixture.preview();
		await previewServer.stop();
	});
});
