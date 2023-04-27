import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Component bundling', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/astro-component-bundling/', import.meta.url) });
		await fixture.build();
	});

	it('should treeshake FooComponent', async () => {
		const astroChunkDir = await fixture.readdir('/_astro');
		const manyComponentsChunkName = astroChunkDir.find((chunk) =>
			chunk.startsWith('ManyComponents')
		);
		const manyComponentsChunkContent = await fixture.readFile(`/_astro/${manyComponentsChunkName}`);
		expect(manyComponentsChunkContent).to.not.include('FooComponent');
	});
});
