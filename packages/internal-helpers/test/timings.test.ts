import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { setBuildTimings, timedVisitorPlugins } from '../dist/timings.js';

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
