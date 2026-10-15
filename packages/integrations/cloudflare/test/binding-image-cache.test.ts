import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

// https://github.com/withastro/astro/issues/17408
describe('BindingImageService with cache provider', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/binding-image-cache/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('keeps returning 200 for repeated /_image requests (cache hits)', async () => {
		const url = '/_image?href=/placeholder.jpg&f=png&w=100';

		const first = await fixture.fetch(url);
		assert.equal(first.status, 200);
		assert.equal(first.headers.get('content-type'), 'image/png');

		// The second request is served from the Workers cache. Cached
		// responses have immutable headers, which the request handler
		// must not mutate in place.
		const second = await fixture.fetch(url);
		assert.equal(second.status, 200);
		assert.equal(second.headers.get('content-type'), 'image/png');
	});
});
