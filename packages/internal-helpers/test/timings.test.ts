import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { setBuildTimings, time, timedPlugin, timedVisitorPlugins } from '../dist/timings.js';

interface Recorded {
	kind: string;
	name: string;
	duration: number;
}

function collect(): Recorded[] {
	const records: Recorded[] = [];
	setBuildTimings({
		record: (kind, name, duration) => records.push({ kind, name, duration }),
	});
	return records;
}

afterEach(() => setBuildTimings(undefined));

describe('time', () => {
	it('records once a returned promise settles, including on rejection', async () => {
		const records = collect();

		await time('kind', 'resolved', () => new Promise((resolve) => setTimeout(resolve, 20)));
		await assert.rejects(time('kind', 'rejected', () => Promise.reject(new Error('boom'))));

		assert.deepEqual(
			records.map((record) => record.name),
			['resolved', 'rejected'],
		);
		assert.ok(records[0].duration >= 15);
	});

	it('records synchronous calls that throw', () => {
		const records = collect();

		assert.throws(() =>
			time('kind', 'sync', () => {
				throw new Error('boom');
			}),
		);

		assert.equal(records.length, 1);
	});
});

describe('timedPlugin', () => {
	it('reuses one wrapper per plugin, kind and name so unified can merge options', () => {
		collect();
		const plugin = () => () => undefined;

		assert.equal(
			timedPlugin('markdown-plugin', 'p', plugin),
			timedPlugin('markdown-plugin', 'p', plugin),
		);
		assert.notEqual(
			timedPlugin('markdown-plugin', 'p', plugin),
			timedPlugin('mdx-plugin', 'p', plugin),
		);
	});

	it('attributes transformer time to the given kind and name', async () => {
		const records = collect();
		const plugin = () => async () => undefined;

		const transformer = (timedPlugin('mdx-plugin', 'remark-gfm', plugin) as any)();
		await transformer({}, {});

		assert.deepEqual(
			records.map((record) => [record.kind, record.name]),
			[['mdx-plugin', 'remark-gfm']],
		);
	});
});

describe('timedVisitorPlugins', () => {
	it('attributes each visitor to the plugin that declared it', async () => {
		const records = collect();
		const seen: string[] = [];

		const [plugin] = timedVisitorPlugins<any>('markdown-plugin', [
			{
				name: 'astro-expressive-code-satteri',
				element: {
					filter: ['pre'],
					async visit(node: string) {
						seen.push(node);
					},
				},
				text(node: string) {
					seen.push(node);
				},
			},
		]);

		assert.deepEqual(plugin.element.filter, ['pre']);
		await plugin.element.visit('pre-node', {});
		plugin.text('text-node');

		assert.deepEqual(seen, ['pre-node', 'text-node']);
		assert.deepEqual(
			records.map((record) => [record.kind, record.name]),
			[
				['markdown-plugin', 'astro-expressive-code-satteri'],
				['markdown-plugin', 'astro-expressive-code-satteri'],
			],
		);
	});

	it('resolves factories and nested arrays before wrapping', () => {
		const records = collect();

		const entries = timedVisitorPlugins<any>('mdx-plugin', [
			() => [{ name: 'from-factory', text: () => undefined }],
			false,
			null,
		]);

		const nested = (entries[0] as (ctx: unknown) => any)({});
		nested[0].text('node');

		assert.equal(entries[1], false);
		assert.equal(entries[2], null);
		assert.deepEqual(
			records.map((record) => record.name),
			['from-factory'],
		);
	});

	it('leaves class-based plugins untouched rather than dropping their prototype', () => {
		collect();

		class VisitorPlugin {
			name = 'class-plugin';
			text() {}
		}
		const instance = new VisitorPlugin();

		const [plugin] = timedVisitorPlugins<any>('markdown-plugin', [instance]);

		assert.equal(plugin, instance);
		assert.equal(typeof plugin.text, 'function');
	});

	it('returns the list untouched when no recorder is installed', () => {
		setBuildTimings(undefined);
		const entries = [{ name: 'plugin', text: () => undefined }];

		assert.equal(timedVisitorPlugins('markdown-plugin', entries)[0], entries[0]);
	});
});
