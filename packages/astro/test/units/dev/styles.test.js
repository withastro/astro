import { expect } from 'chai';

import { getStylesForURL } from '../../../dist/core/render/dev/css.js';
import { viteID } from '../../../dist/core/util.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

class TestLoader {
	constructor(modules) {
		this.modules = new Map(modules.map((m) => [m.id, m]));
	}
	getModuleById(id) {
		return this.modules.get(id);
	}
	getModulesByFile(id) {
		return this.modules.has(id) ? [this.modules.get(id)] : [];
	}
}

describe('Crawling graph for CSS', () => {
	let loader;
	before(() => {
		const indexId = viteID(new URL('./src/pages/index.astro', root));
		const aboutId = viteID(new URL('./src/pages/about.astro', root));
		loader = new TestLoader([
			{
				id: indexId,
				importedModules: [
					{
						id: aboutId,
						url: aboutId,
						importers: new Set(),
					},
					{
						id: indexId + '?astro&style.css',
						url: indexId + '?astro&style.css',
						importers: new Set([{ id: indexId }]),
						ssrModule: {},
					},
				],
				importers: new Set(),
				ssrTransformResult: {
					deps: [indexId + '?astro&style.css'],
				},
			},
			{
				id: aboutId,
				importedModules: [
					{
						id: aboutId + '?astro&style.css',
						url: aboutId + '?astro&style.css',
						importers: new Set([{ id: aboutId }]),
						ssrModule: {},
					},
				],
				importers: new Set(),
				ssrTransformResult: {
					deps: [aboutId + '?astro&style.css'],
				},
			},
		]);
	});

	it("importedModules is checked against the child's importers", async () => {
		// In dev mode, HMR modules tracked are added to importedModules. We use `importers`
		// to verify that they are true importers.
		const res = await getStylesForURL(
			new URL('./src/pages/index.astro', root),
			loader,
			'development'
		);
		expect(res.urls.size).to.equal(1);
	});
});
