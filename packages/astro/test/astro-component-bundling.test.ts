import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Component bundling', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-component-bundling/',
			outDir: './dist/astro-component-bundling/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('should treeshake FooComponent', {
			skip: 'Not sure how this can possibly work, we bundle the module as an entrypoint.',
		}, async () => {
			const astroChunkDir = await fixture.readdir('/_astro');
			const manyComponentsChunkName = astroChunkDir.find((chunk) =>
				chunk.startsWith('ManyComponents'),
			);
			const manyComponentsChunkContent = await fixture.readFile(
				`/_astro/${manyComponentsChunkName}`,
			);
			assert.equal(manyComponentsChunkContent.includes('FooComponent'), false);
		});

		it('should not include Astro components in client bundles', async () => {
			const html = await fixture.readFile('/astro-in-client/index.html');
			const match = /<script.+<\/script>/.exec(html);
			assert(match, 'Expected a <script> tag to be present');
			assert.match(
				match[0],
				/^<script type="module">const \w=\{\};console.log\(\w\);<\/script>$/,
				'Astro component on the client should be an empty object in prod',
			);
		});
	});
});
