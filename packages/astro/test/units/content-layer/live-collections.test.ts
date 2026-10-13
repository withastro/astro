import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAst } from 'vite';
import { defineCollection } from '../../../dist/content/config.js';
import { sliceLiveCollections } from '../../../dist/content/live-collections.js';
import { globalContentConfigObserver } from '../../../dist/content/utils.js';
import { astroLiveCollectionsPlugin } from '../../../dist/content/vite-plugin-live-collections.js';
import { SpyLogger } from '../test-utils.ts';

function slice(code: string, liveNames?: string[]) {
	return sliceLiveCollections(code, parseAst(code), liveNames && new Set(liveNames));
}

function sliced(code: string, liveNames?: string[]) {
	const result = slice(code, liveNames);
	assert.equal(result.type, 'sliced');
	return result as Extract<typeof result, { type: 'sliced' }>;
}

/** Collapses whitespace so that assertions don't depend on the blank lines left by removed code. */
function normalize(code: string) {
	return code.replace(/\s+/g, ' ').trim();
}

const config = `import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { cmsLoader } from 'my-cms';
import { client } from './lib/cms';
const blog = defineCollection({ loader: glob({ pattern: '**/*.md', base: './blog' }) });
const products = defineCollection({ type: 'live', loader: cmsLoader({ client }) });
export const collections = { blog, products };`;

describe('sliceLiveCollections()', () => {
	it('keeps only the live collections and the code they reference', () => {
		const result = sliced(config, ['products']);
		assert.equal(
			normalize(result.code),
			normalize(`import { defineCollection } from 'astro:content';
import { cmsLoader } from 'my-cms';
import { client } from './lib/cms';
const products = defineCollection({ type: 'live', loader: cmsLoader({ client }) });
export const collections = { products };`),
		);
		assert.deepEqual(result.droppedStatements, []);
	});

	it('keeps live collections defined inline', () => {
		const result = sliced(
			`import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { cmsLoader } from 'my-cms';
export const collections = {
	blog: defineCollection({ loader: glob({ pattern: '*.md' }) }),
	products: defineCollection({ type: 'live', loader: cmsLoader() }),
};`,
			['products'],
		);
		assert.match(result.code, /products: defineCollection\(\{ type: 'live', loader: cmsLoader\(\) \}\)/);
		assert.doesNotMatch(result.code, /glob/);
	});

	it('removes only the unused specifiers of an import', () => {
		const result = sliced(
			`import { defineCollection, reference as ref } from 'astro:content';
import { z } from 'astro/zod';
import { cmsLoader } from 'my-cms';
const blog = defineCollection({ loader: () => [], schema: z.object({ author: ref('authors') }) });
const products = defineCollection({ type: 'live', loader: cmsLoader(), schema: z.object({}) });
export const collections = { blog, products };`,
			['products'],
		);
		assert.match(result.code, /import \{ defineCollection \} from "astro:content";/);
		assert.match(result.code, /import \{ z \} from 'astro\/zod';/);
	});

	it('keeps side-effect imports and statements that reference kept bindings', () => {
		const result = sliced(
			`import 'dotenv/config';
import { defineCollection } from 'astro:content';
import { cmsLoader } from 'my-cms';
const options = {};
options.token = process.env.TOKEN;
const products = defineCollection({ type: 'live', loader: cmsLoader(options) });
export const collections = { products };`,
			['products'],
		);
		assert.match(result.code, /import 'dotenv\/config';/);
		assert.match(result.code, /options\.token = process\.env\.TOKEN;/);
		assert.deepEqual(result.droppedStatements, []);
	});

	it('reports the top-level statements that it removes', () => {
		const result = sliced(
			`import { defineCollection } from 'astro:content';
import { cmsLoader } from 'my-cms';
console.log('loading content config');
const products = defineCollection({ type: 'live', loader: cmsLoader() });
export const collections = { products };`,
			['products'],
		);
		assert.doesNotMatch(result.code, /console\.log/);
		assert.deepEqual(result.droppedStatements, [{ line: 3, column: 1 }]);
	});

	it('produces an empty collections object when there are no live collections', () => {
		const result = sliced(
			`import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
export const collections = { blog: defineCollection({ loader: glob({ pattern: '*.md' }) }) };`,
			[],
		);
		assert.equal(normalize(result.code), 'export const collections = { };');
	});

	it('is unsupported when a live collection is not an explicit property of `collections`', () => {
		const result = slice(
			`import { defineCollection } from 'astro:content';
import { liveCollections } from './live';
export const collections = { ...liveCollections };`,
			['products'],
		);
		assert.equal(result.type, 'unsupported');
	});

	it('is unsupported when a live collection is not defined with `defineCollection()`', () => {
		const result = slice(
			`import { createProducts } from './live';
const products = createProducts();
export const collections = { products };`,
			['products'],
		);
		assert.equal(result.type, 'unsupported');
	});

	it('is unsupported when `collections` is not an object literal', () => {
		const result = slice(
			`import { all } from './all';
export const collections = Object.fromEntries(all);`,
			['products'],
		);
		assert.equal(result.type, 'unsupported');
	});

	it('drops collections it cannot classify when the live collections are unknown', () => {
		const result = sliced(
			`import { createBlog } from './blog';
const blog = createBlog();
export const collections = { blog };`,
		);
		assert.equal(normalize(result.code), 'export const collections = { };');
	});
});

describe("defineCollection({ type: 'live' })", () => {
	const loader = {
		name: 'test-loader',
		loadCollection: async () => ({ entries: [] }),
		loadEntry: async () => undefined,
	};

	it('accepts a live loader', () => {
		const collection = defineCollection({ type: 'live', loader });
		assert.equal(collection.type, 'live');
		assert.equal(collection.loader, loader);
	});

	it('requires `loadCollection()` and `loadEntry()`', () => {
		assert.throws(
			// @ts-expect-error: `loadEntry` is missing
			() => defineCollection({ type: 'live', loader: { name: 'x', loadCollection: loader.loadCollection } }),
			/must have `loadCollection\(\)` and `loadEntry\(\)` methods/,
		);
	});

	it('rejects schema functions', () => {
		assert.throws(
			// @ts-expect-error: live collections only accept schema objects
			() => defineCollection({ type: 'live', loader, schema: () => ({}) }),
			/schema cannot be a function/,
		);
	});
});

describe('astroLiveCollectionsPlugin()', () => {
	function transform(code: string, collections: Record<string, any>) {
		globalContentConfigObserver.set({ status: 'loaded', config: { collections } as any });
		const logger = new SpyLogger();
		const plugin = astroLiveCollectionsPlugin({ logger });
		const { handler } = plugin.transform as any;
		const result = handler.call({ parse: parseAst }, code, '/src/content.config.ts?astroLiveCollections');
		return { result, logger };
	}

	it('slices the content config', () => {
		const { result, logger } = transform(config, { blog: {}, products: { type: 'live' } });
		assert.doesNotMatch(result.code, /glob/);
		assert.equal(logger.logs.length, 0);
	});

	it('skips the content config when it has no live collections', () => {
		const { result } = transform(config, { blog: {} });
		assert.equal(result.code, 'export const collections = {};');
	});

	it('keeps the whole content config and warns when it cannot be sliced', () => {
		const { result, logger } = transform(
			`import { liveCollections } from './live';
export const collections = { ...liveCollections };`,
			{ products: { type: 'live' } },
		);
		assert.equal(result, undefined);
		assert.equal(logger.logs.length, 1);
		assert.equal(logger.logs[0].level, 'warn');
		assert.match(logger.logs[0].message, /\/src\/content\.config\.ts:2:28/);
		assert.match(logger.logs[0].message, /must be an explicit property of \`collections\`/);
	});
});
