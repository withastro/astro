import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Component bundling', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-component-bundling/' });
	});

	describe('dev', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should not include Astro components in client bundles', async () => {
			const importedComponent = await fixture.fetch('/src/components/AstroComponent.astro');
			const moduleContent = await importedComponent.text();
			assert(
				moduleContent.includes('Astro components cannot be used in the browser.'),
				'Astro component imported from client should include error text in dev.',
			);
			assert(
				moduleContent.length < 3500,
				'Module content should be small and not include full server-side code.',
			);
			assert(
				!moduleContent.includes('import '),
				'Astro component imported from client should not include import statements.',
			);
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('should treeshake FooComponent', async () => {
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
