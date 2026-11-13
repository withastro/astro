import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { setBuildTimings } from '@astrojs/internal-helpers/timings';
import { BuildTimingsCollector } from '../../../dist/core/build/timings/collector.js';
import { renderCliReport } from '../../../dist/core/build/timings/report-cli.js';
import { buildTimingsPlugin } from '../../../dist/core/build/timings/vite-plugins.js';

const context = { root: '/project/', output: 'static' };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('BuildTimingsCollector', () => {
	it('nests spans under the phase that started them, even when phases run concurrently', async () => {
		const collector = new BuildTimingsCollector();

		await collector.span('setup', async () => {
			await Promise.all([
				collector.span('a', async () => {
					await sleep(5);
					await collector.span('a.child', async () => {});
				}),
				collector.span('b', () => sleep(1)),
			]);
		});

		const byName = new Map(collector.toData(context).spans.map((span) => [span.name, span]));
		assert.equal(byName.get('setup')!.parentId, null);
		assert.equal(byName.get('a')!.parentId, byName.get('setup')!.id);
		assert.equal(byName.get('b')!.parentId, byName.get('setup')!.id);
		assert.equal(byName.get('a.child')!.parentId, byName.get('a')!.id);
	});

	it('groups plugin hooks per plugin, per hook and per module', () => {
		const collector = new BuildTimingsCollector();

		collector.record('vite-hook', 'astro:build', 10, { hook: 'transform', module: '/a.astro' });
		collector.record('vite-hook', 'astro:build', 30, { hook: 'transform', module: '/b.astro' });
		collector.record('vite-hook', 'astro:build', 5, { hook: 'resolveId' });
		collector.record('vite-hook', 'vite:css', 20, { hook: 'transform', module: '/a.astro' });

		const { plugins, modules } = collector.toData(context);
		assert.deepEqual(
			plugins.entries.map((plugin) => [plugin.name, plugin.calls]),
			[
				['astro:build', 3],
				['vite:css', 1],
			],
		);
		assert.deepEqual(
			plugins.entries[0].children.map((hook) => [hook.name, hook.calls]),
			[
				['transform', 2],
				['resolveId', 1],
			],
		);
		assert.deepEqual(modules.entries.map((module) => module.name).sort(), ['/a.astro', '/b.astro']);
		assert.deepEqual(
			modules.entries
				.find((module) => module.name === '/a.astro')!
				.children.map((plugin) => plugin.name)
				.sort(),
			['astro:build', 'vite:css'],
		);
	});

	it('counts overlapping work once', () => {
		const collector = new BuildTimingsCollector();

		// Recorded back to back, so both measurements cover the same 100ms.
		collector.record('highlight', 'ts', 100);
		collector.record('highlight', 'js', 100);

		const { highlight } = collector.toData(context);
		assert.equal(highlight.blocks, 2);
		assert.ok(
			highlight.wallDuration >= 100 && highlight.wallDuration < 110,
			`expected ~100ms of wall clock, got ${highlight.wallDuration}`,
		);
	});

	it('separates cached pages from rendered ones', () => {
		const collector = new BuildTimingsCollector();

		collector.record('page', '/a', 30, { route: '/[slug]', cached: false });
		collector.record('page', '/b', 10, { route: '/[slug]', cached: true });

		const { pages } = collector.toData(context);
		assert.equal(pages.count, 2);
		assert.equal(pages.cached, 1);
		assert.equal(pages.entries[0].name, '/a');
	});

	it('splits page time into the render and the pipeline around it', () => {
		const collector = new BuildTimingsCollector();

		collector.record('page-render', '/a', 24);
		collector.record('page', '/a', 30, { route: '/[slug]', cached: false });

		const { pages } = collector.toData(context);
		assert.ok(pages.renderDuration >= 24 && pages.renderDuration < 30);
		assert.ok(pages.wallDuration > pages.renderDuration);
	});

	it('keeps Markdown and MDX runs of the same plugin apart', () => {
		const collector = new BuildTimingsCollector();

		collector.record('markdown-plugin', 'remark-gfm', 10);
		collector.record('mdx-plugin', 'remark-gfm', 10);

		assert.deepEqual(
			collector
				.toData(context)
				.markdown.plugins.map((plugin) => plugin.pipeline)
				.sort(),
			['markdown', 'mdx'],
		);
	});
});

describe('renderCliReport', () => {
	it('prints a section for every kind of measurement', () => {
		const collector = new BuildTimingsCollector();
		collector.record('vite-hook', 'astro:markdown', 40, {
			hook: 'transform',
			module: '/project/src/pages/index.md',
		});
		collector.record('highlight', 'ts', 25);
		collector.record('markdown-file', '/project/src/pages/index.md', 60);
		collector.record('markdown-plugin', 'rehype-shiki', 25);
		collector.record('page', '/', 12, { route: '/', cached: false });
		collector.record('image', '/_astro/hero.webp', 8, { cached: false });
		collector.record('integration', '@astrojs/sitemap', 4, { hook: 'astro:build:done' });
		collector.record('astro-compile', '/project/src/pages/index.astro', 3);

		const report = renderCliReport(collector.toData(context));

		for (const section of [
			'Vite plugins',
			'Markdown plugins',
			'Syntax highlighting',
			'Slowest files to bundle',
			'Astro compiler',
			'Slowest pages',
			'Images',
			'Integrations',
		]) {
			assert.ok(report.includes(section), `expected the report to include "${section}"`);
		}
	});

	it('renders a render time that exceeds its page time', () => {
		const collector = new BuildTimingsCollector();
		collector.record('page-render', '/a', 500);
		collector.record('page', '/a', 1, { route: '/', cached: false });

		assert.doesNotThrow(() => renderCliReport(collector.toData(context)));
	});

	it('omits sections that recorded nothing', () => {
		const report = renderCliReport(new BuildTimingsCollector().toData(context));

		assert.ok(!report.includes('Build phases'));
		assert.ok(!report.includes('Syntax highlighting'));
		assert.ok(!report.includes('Slowest pages'));
	});
});

describe('buildTimingsPlugin', () => {
	afterEach(() => setBuildTimings(undefined));

	function instrument(plugins: any[]) {
		const collector = new BuildTimingsCollector();
		setBuildTimings(collector);
		(buildTimingsPlugin().configResolved as any)({ plugins });
		return collector;
	}

	it('records hooks written as functions and as objects', async () => {
		const sync = { name: 'sync', transform: (_code: string, id: string) => ({ code: id }) };
		const async = {
			name: 'async',
			load: { filter: { id: /x/ }, handler: async (id: string) => id },
		};
		const collector = instrument([sync, async]);

		assert.deepEqual(sync.transform('code', '/a.ts'), { code: '/a.ts' });
		assert.deepEqual(async.load.filter, { id: /x/ });
		await async.load.handler('/b.ts');

		const { plugins, modules } = collector.toData(context);
		assert.deepEqual(plugins.entries.map((plugin) => plugin.name).sort(), ['async', 'sync']);
		assert.deepEqual(modules.entries.map((module) => module.name).sort(), ['/a.ts', '/b.ts']);
	});

	it('instruments a plugin shared between environments only once', () => {
		const shared = { name: 'shared', transform: () => undefined };
		instrument([shared]);
		const collector = instrument([shared]);

		shared.transform();

		assert.equal(collector.toData(context).plugins.entries[0].calls, 1);
	});

	it('does not charge a hook for resolution it delegates to other plugins', async () => {
		const delegating = {
			name: 'delegating',
			async resolveId(this: any, source: string) {
				return this.resolve(source);
			},
		};
		const collector = instrument([delegating]);

		const pluginContext = { resolve: () => sleep(60).then(() => ({ id: '/x.ts' })) };
		await delegating.resolveId.call(pluginContext, './x.ts');

		const [plugin] = collector.toData(context).plugins.entries;
		assert.ok(plugin.total < 30, `delegated time should not be charged, got ${plugin.total}`);
	});

	it('subtracts parallel delegated calls once', async () => {
		const delegating = {
			name: 'delegating',
			async transform(this: any) {
				await sleep(60);
				await Promise.all([this.resolve(), this.resolve(), this.resolve()]);
			},
		};
		const collector = instrument([delegating]);

		await delegating.transform.call({ resolve: () => sleep(60) });

		const [plugin] = collector.toData(context).plugins.entries;
		assert.ok(plugin.total >= 50, `own time should still be charged, got ${plugin.total}`);
	});

	it('leaves frozen plugins alone', () => {
		const transform = () => undefined;
		const frozen = Object.freeze({ name: 'frozen', transform });
		instrument([frozen]);

		assert.equal(frozen.transform, transform);
	});
});
