import { expect } from 'chai';
import { fileURLToPath } from 'url';

import {
	getStylesForURL
} from '../../../dist/core/render/dev/css.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

class TestLoader {
	constructor(modules) {
		this.modules = new Map(modules.map(m => [m.id, m]))
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
		const indexId = fileURLToPath(new URL('./src/pages/index.astro', root));
		const aboutId = fileURLToPath(new URL('./src/pages/about.astro', root));
		loader = new TestLoader([
			{
				id: indexId,
				importedModules: [{
					id: aboutId,
					importers: []
				}, {
					id: indexId + '?astro&style.css',
					url: indexId + '?astro&style.css',
					importers: [{ id: indexId }],
					ssrModule: {}
				}],
				importers: []
			},
			{
				id: aboutId,
				importedModules: [{
					id: aboutId + '?astro&style.css',
					url: aboutId + '?astro&style.css',
					importers: [{ id: aboutId }],
					ssrModule: {}
				}],
				importers: []
			}
		]);
	})

	it('importedModules is checked against the child\'s importers', async () => {
		// In dev mode, HMR modules tracked are added to importedModules. We use `importers`
		// to verify that they are true importers.
		const res = await getStylesForURL(new URL('./src/pages/index.astro', root), loader, 'development')
		expect(res.urls.size).to.equal(1);
	})
})
