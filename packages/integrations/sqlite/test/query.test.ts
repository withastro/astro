import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { LocalDatabase } from '../dist/node/local-database.js';
import { syncCollections } from '../dist/node/sync.js';
import {
	type CollectionFilter,
	compileCollectionQuery,
	compileEntryQuery,
	type EntryFilter,
	hydrateRow,
} from '../dist/runtime/query.js';

type Post = {
	title: string;
	views: number;
	draft: boolean;
	pubDate: Date;
	tags: string[];
	author: { id: string; collection: string };
	rating?: number | null;
};

const posts = new Map<string, { id: string; data: Post; rendered?: { html: string } }>([
	[
		'a',
		{
			id: 'a',
			data: {
				title: 'Alpha',
				views: 10,
				draft: false,
				pubDate: new Date('2024-01-01T00:00:00.000Z'),
				tags: ['x', 'y'],
				author: { id: 'ada', collection: 'authors' },
				rating: 4,
			},
			rendered: { html: '<p>alpha</p>' },
		},
	],
	[
		'b',
		{
			id: 'b',
			data: {
				title: 'Beta 100%',
				views: 200,
				draft: true,
				pubDate: new Date('2024-02-01T00:00:00.000Z'),
				tags: ['y'],
				author: { id: 'grace', collection: 'authors' },
				rating: null,
			},
		},
	],
	[
		'c',
		{
			id: 'c',
			data: {
				title: 'Gamma',
				views: 50,
				draft: false,
				pubDate: new Date('2024-03-01T00:00:00.000Z'),
				tags: [],
				author: { id: 'ada', collection: 'authors' },
			},
		},
	],
]);

describe('query compiler', () => {
	let dir: string;
	let db: LocalDatabase;
	const target = { tablePrefix: 'content_', collection: 'posts' };

	before(async () => {
		dir = mkdtempSync(join(tmpdir(), 'astro-sqlite-'));
		db = new LocalDatabase(pathToFileURL(join(dir, 'test.db')));
		await syncCollections(db.executor, new Map([['posts', posts]]), { tablePrefix: 'content_' });
	});

	after(() => {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	});

	async function ids(filter?: CollectionFilter<Post>) {
		const { sql, params } = compileCollectionQuery(target, filter);
		const rows = await db.client.all(sql, params);
		return rows.map((row) => hydrateRow(row).id);
	}

	async function entry(filter: EntryFilter<Post>) {
		const { sql, params } = compileEntryQuery(target, filter);
		const rows = await db.client.all(sql, params);
		return rows[0] ? hydrateRow(rows[0]) : undefined;
	}

	it('returns everything ordered by id by default', async () => {
		assert.deepEqual(await ids(), ['a', 'b', 'c']);
	});

	it('revives dates and keeps nested data', async () => {
		const { sql, params } = compileCollectionQuery(target, { where: { id: 'a' } });
		const [row] = await db.client.all(sql, params);
		const { data } = hydrateRow(row);
		assert.ok(data.pubDate instanceof Date);
		assert.equal((data.pubDate as Date).toISOString(), '2024-01-01T00:00:00.000Z');
		assert.deepEqual(data.author, { id: 'ada', collection: 'authors' });
		assert.deepEqual(data.tags, ['x', 'y']);
	});

	it('supports scalar operators', async () => {
		assert.deepEqual(await ids({ where: { views: { gt: 10 } } }), ['b', 'c']);
		assert.deepEqual(await ids({ where: { views: { gte: 50, lt: 200 } } }), ['c']);
		assert.deepEqual(await ids({ where: { draft: true } }), ['b']);
		assert.deepEqual(await ids({ where: { draft: { ne: true } } }), ['a', 'c']);
		assert.deepEqual(await ids({ where: { title: { in: ['Alpha', 'Gamma'] } } }), ['a', 'c']);
		assert.deepEqual(await ids({ where: { title: { notIn: ['Alpha'] } } }), ['b', 'c']);
		assert.deepEqual(await ids({ where: { title: { in: [] } } }), []);
		assert.deepEqual(await ids({ where: { pubDate: { gte: new Date('2024-02-01') } } }), [
			'b',
			'c',
		]);
	});

	it('supports string operators and escapes LIKE wildcards', async () => {
		assert.deepEqual(await ids({ where: { title: { startsWith: 'Al' } } }), ['a']);
		assert.deepEqual(await ids({ where: { title: { endsWith: 'ma' } } }), ['c']);
		assert.deepEqual(await ids({ where: { title: { contains: '100%' } } }), ['b']);
		assert.deepEqual(await ids({ where: { title: { contains: '10_' } } }), []);
		assert.deepEqual(await ids({ where: { title: { like: '%a' } } }), ['a', 'c']);
	});

	it('supports null checks', async () => {
		assert.deepEqual(await ids({ where: { rating: { isNull: true } } }), ['b', 'c']);
		assert.deepEqual(await ids({ where: { rating: { isNull: false } } }), ['a']);
		assert.deepEqual(await ids({ where: { rating: null } }), ['b', 'c']);
		assert.deepEqual(await ids({ where: { rating: { ne: null } } }), ['a']);
	});

	it('supports array operators', async () => {
		assert.deepEqual(await ids({ where: { tags: { includes: 'x' } } }), ['a']);
		assert.deepEqual(await ids({ where: { tags: { includesAny: ['x', 'z'] } } }), ['a']);
		assert.deepEqual(await ids({ where: { tags: { includesAll: ['x', 'y'] } } }), ['a']);
		assert.deepEqual(await ids({ where: { tags: { includesAll: ['y'] } } }), ['a', 'b']);
		assert.deepEqual(await ids({ where: { tags: { isEmpty: true } } }), ['c']);
		assert.deepEqual(await ids({ where: { tags: { isEmpty: false } } }), ['a', 'b']);
	});

	it('supports nested fields and dotted paths', async () => {
		assert.deepEqual(await ids({ where: { author: { id: 'ada' } } }), ['a', 'c']);
		assert.deepEqual(await ids({ where: { 'author.id': 'grace' } as any }), ['b']);
	});

	it('supports logical operators', async () => {
		assert.deepEqual(await ids({ where: { OR: [{ views: 10 }, { views: 50 }] } }), ['a', 'c']);
		assert.deepEqual(await ids({ where: { AND: [{ draft: false }, { views: { gt: 10 } }] } }), [
			'c',
		]);
		assert.deepEqual(await ids({ where: { NOT: { draft: false } } }), ['b']);
	});

	it('supports ordering, limit and offset', async () => {
		assert.deepEqual(await ids({ orderBy: { views: 'desc' } }), ['b', 'c', 'a']);
		assert.deepEqual(await ids({ orderBy: [{ draft: 'asc' }, { views: 'desc' }] }), [
			'c',
			'a',
			'b',
		]);
		assert.deepEqual(await ids({ orderBy: { views: 'desc' }, limit: 2 }), ['b', 'c']);
		assert.deepEqual(await ids({ orderBy: { views: 'desc' }, limit: 1, offset: 1 }), ['c']);
		assert.deepEqual(await ids({ offset: 2 }), ['c']);
	});

	it('projects selected fields and still revives their dates', async () => {
		const { sql, params } = compileCollectionQuery(target, {
			select: ['title', 'pubDate'],
			where: { id: 'a' },
		});
		const [row] = await db.client.all(sql, params);
		const { data } = hydrateRow(row);
		assert.deepEqual(Object.keys(data).sort(), ['pubDate', 'title']);
		assert.ok(data.pubDate instanceof Date);
	});

	it('only includes rendered html on request', async () => {
		const withoutRendered = compileCollectionQuery(target, { where: { id: 'a' } });
		const [plain] = await db.client.all(withoutRendered.sql, withoutRendered.params);
		assert.equal(hydrateRow(plain).rendered, undefined);
		const withRendered = compileCollectionQuery(target, { where: { id: 'a' }, rendered: true });
		const [full] = await db.client.all(withRendered.sql, withRendered.params);
		assert.deepEqual(hydrateRow(full).rendered, { html: '<p>alpha</p>' });
	});

	it('loads single entries by id or filter', async () => {
		assert.equal((await entry({ id: 'b' }))?.data.title, 'Beta 100%');
		assert.deepEqual((await entry({ id: 'a' }))?.rendered, { html: '<p>alpha</p>' });
		assert.equal(
			(await entry({ where: { views: { gt: 10 } }, orderBy: { views: 'desc' } }))?.id,
			'b',
		);
		assert.equal(await entry({ id: 'nope' }), undefined);
	});

	it('rejects ambiguous array conditions', () => {
		assert.throws(
			() => compileCollectionQuery(target, { where: { tags: ['x'] } as any }),
			/includes/,
		);
	});

	it('syncs incrementally', async () => {
		const updated = new Map(posts);
		updated.delete('c');
		updated.set('a', { ...posts.get('a')!, data: { ...posts.get('a')!.data, views: 11 } });
		const result = await syncCollections(db.executor, new Map([['posts', updated]]), {
			tablePrefix: 'content_',
		});
		assert.deepEqual(result.collections, { posts: { upserted: 1, deleted: 1 } });
		assert.deepEqual(await ids({ where: { views: 11 } }), ['a']);
		assert.deepEqual(await ids(), ['a', 'b']);

		const noop = await syncCollections(db.executor, new Map([['posts', updated]]), {
			tablePrefix: 'content_',
		});
		assert.equal(noop.changed, false);
	});
});
