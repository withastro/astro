import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { image } from '../../../dist/content/image.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

/**
 * `image()` resolves aliases with the resolver of the `ContentLayer` running it. These
 * cover that a parse only ever sees its own layer's resolver, including when parses from
 * separate layers overlap or a loader reparses an entry after the sync, and that nothing is
 * left behind outside a parse.
 */

const realImage = fileURLToPath(
	new URL(
		'../../fixtures/content-collection-picture-render/src/assets/test-image.png',
		import.meta.url,
	),
);
const context = { filePath: realImage };

/** A server whose resolver finds every source at `resolved`, or none with `null`. */
function fakeViteServer(resolved: string | null): any {
	return {
		environments: {
			ssr: { pluginContainer: { resolveId: async () => resolved && { id: resolved } } },
		},
	};
}

/** What `image()` makes of an alias: resolved with dimensions, not found, or deferred. */
async function resolveAlias() {
	try {
		const field = await image(context, { src: '~/cover.png' });
		return field.width ? 'resolved' : 'deferred';
	} catch {
		return 'not found';
	}
}

/** A schema that reports what `image()` made of an alias while the entry was parsed. */
const schema = {
	'~standard': {
		version: 1,
		vendor: 'test',
		validate: async () => ({ value: { cover: await resolveAlias() } }),
	},
};

type Parse = () => Promise<string>;

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}

function createLayer(load: (parse: Parse) => Promise<void>, viteServer?: any) {
	return new ContentLayer({
		settings: createMinimalSettings(createTempDir()),
		logger: new AstroLogger({ destination: { write: () => true }, level: 'silent' }),
		store: new MutableDataStore(),
		contentConfigObserver: createTestConfigObserver({
			posts: defineCollection({
				loader: {
					name: 'test',
					load: ({ parseData }: any) =>
						load(async () => (await parseData({ id: 'post', data: {} })).cover),
				},
				schema: schema as any,
			}),
		}),
		viteServer,
	});
}

describe('Content Layer - image resolver scope', () => {
	it('uses the resolver while an entry is parsed only', async () => {
		let parsed: string | undefined;
		await createLayer(async (parse) => {
			parsed = await parse();
		}, fakeViteServer(realImage)).sync();

		assert.equal(parsed, 'resolved');
		assert.equal(await resolveAlias(), 'deferred');
	});

	it('uses the resolver when a loader reparses an entry after the sync', async () => {
		let reparse: Parse | undefined;
		await createLayer(async (parse) => {
			reparse = parse;
		}, fakeViteServer(realImage)).sync();

		assert.equal(await reparse?.(), 'resolved');
	});

	it('uses the resolver when a loader calls image() itself', async () => {
		let direct: string | undefined;
		await createLayer(async () => {
			direct = await resolveAlias();
		}, fakeViteServer(realImage)).sync();

		assert.equal(direct, 'resolved');
	});

	it('defers resolution when there is no vite server', async () => {
		let parsed: string | undefined;
		await createLayer(async (parse) => {
			parsed = await parse();
		}).sync();

		assert.equal(parsed, 'deferred');
	});

	it('keeps overlapping parses on their own resolvers', async () => {
		const firstStarted = deferred();
		const secondStarted = deferred();
		let first: string | undefined;
		let second: string | undefined;

		const firstSync = createLayer(async (parse) => {
			firstStarted.resolve();
			await secondStarted.promise;
			first = await parse();
		}, fakeViteServer(realImage)).sync();
		// Only start the second sync once the first is inside its loader, so the two overlap.
		await firstStarted.promise;
		const secondSync = createLayer(async (parse) => {
			secondStarted.resolve();
			second = await parse();
		}, fakeViteServer(null)).sync();
		await Promise.all([firstSync, secondSync]);

		assert.equal(first, 'resolved');
		assert.equal(second, 'not found');
	});
});
