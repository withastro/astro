import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { satteri } from '../dist/index.js';

const SHARED = { syntaxHighlight: false, shikiConfig: {} } as const;

const SRC_DIR_PATH = path.resolve('project', 'src');
const PAGE_PATH = path.join(SRC_DIR_PATH, 'pages', 'index.mdx');

async function renderMdx(content: string) {
	const renderer = await satteri().createMdxRenderer!(SHARED, { optimize: false });
	return renderer.process(content, PAGE_PATH, {});
}

describe('satteri MDX client components', () => {
	it('resolves an import that appears after the component usage', async () => {
		const { code, astroMetadata } = await renderMdx(`# Title

<Counter client:load start={3} />

import Counter from '../components/Counter.jsx';
`);

		assert.match(code, /client:component-path/);
		assert.deepEqual(
			astroMetadata.hydratedComponents.map((c) => c.specifier),
			['Counter'],
		);
	});

	it('resolves an import that appears before the component usage', async () => {
		const { astroMetadata } = await renderMdx(`import Counter from '../components/Counter.jsx';

# Title

<Counter client:load start={3} />
`);

		assert.deepEqual(
			astroMetadata.hydratedComponents.map((c) => c.specifier),
			['Counter'],
		);
	});
});
