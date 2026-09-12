import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BuildTimingsCollector } from '../../../dist/core/build/timings/collector.js';
import { renderCliReport } from '../../../dist/core/build/timings/report-cli.js';
import { instrumentViteConfig } from '../../../dist/core/build/timings/vite-plugins.js';

const context = { root: '/project/', output: 'static' };

describe('BuildTimingsCollector', () => {
	it('nests spans under the phase that is running', async () => {
		const collector = new BuildTimingsCollector();

		await collector.span('setup', 'setup', async () => {
			await collector.span('content sync', 'setup', async () => {});
		});
		await collector.span('client bundle', 'bundle', async () => {});

		const { spans } = collector.toData(context);
		const byName = new Map(spans.map((span) => [span.name, span]));
		assert.equal(spans.length, 3);
		assert.equal(byName.get('setup')!.parentId, null);
		assert.equal(byName.get('content sync')!.parentId, byName.get('setup')!.id);
		assert.equal(byName.get('client bundle')!.parentId, null);
	});

	it('aggregates plugin hooks per plugin, per hook and per module', () => {
		const collector = new BuildTimingsCollector();

		collector.record('vite-hook', 'astro:build', 10, { hook: 'transform', module: '/a.astro' });
		collector.record('vite-hook', 'astro:build', 30, { hook: 'transform', module: '/b.astro' });
		collector.record('vite-hook', 'astro:build', 5, { hook: 'resolveId' });
		collector.record('vite-hook', 'vite:esbuild', 20, { hook: 'transform', module: '/a.astro' });

		const { plugins, modules } = collector.toData(context);
		assert.deepEqual(
			plugins.entries.map((plugin) => [plugin.name, plugin.work, plugin.calls]),
			[
				['astro:build', 45, 3],
				['vite:esbuild', 20, 1],
			],
		);
		// The three calls were recorded back to back, so they cover one ~30ms window.
		assert.ok(
			plugins.entries[0].total >= 30 && plugins.entries[0].total < 45,
			`expected overlapping calls to collapse, got ${plugins.entries[0].total}`,
		);
		assert.deepEqual(
			plugins.entries[0].hooks.map((hook) => [hook.name, hook.work]),
			[
				['transform', 40],
				['resolveId', 5],
			],
		);
		assert.deepEqual(
			modules.entries.map((module) => [module.name, module.total]),
			[
				['/a.astro', 30],
				['/b.astro', 30],
			],
		);
	});

	it('counts overlapping work once for wall-clock totals', () => {
		const collector = new BuildTimingsCollector();

		// Recorded back to back, so both measurements cover the same 100ms.
		collector.record('highlight', 'ts', 100, { chars: 10 });
		collector.record('highlight', 'js', 100, { chars: 20 });

		const { highlight } = collector.toData(context);
		assert.equal(highlight.blocks, 2);
		assert.equal(highlight.totalDuration, 200);
		assert.ok(
			highlight.wallDuration >= 100 && highlight.wallDuration < 110,
			`expected ~100ms of wall clock, got ${highlight.wallDuration}`,
		);
	});

	it('reports a duration for every aggregate, not just its breakdown', () => {
		const collector = new BuildTimingsCollector();

		collector.record('integration', '@astrojs/starlight', 40, { hook: 'astro:config:setup' });
		collector.record('vite-hook', 'astro:build', 40, { hook: 'transform', module: '/a.astro' });
		collector.record('markdown-plugin', 'rehype-shiki', 40);
		collector.record('highlight', 'ts', 40, { chars: 10 });

		const data = collector.toData(context);
		for (const [label, value] of [
			['integration', data.integrations[0].total],
			['vite plugin', data.plugins.entries[0].total],
			['markdown plugin', data.markdown.plugins[0].total],
			['highlight language', data.highlight.languages[0].total],
		] as const) {
			assert.ok(value > 0, `${label} reported ${value}ms despite a 40ms measurement`);
		}
	});

	it('separates cached pages from rendered ones', () => {
		const collector = new BuildTimingsCollector();

		collector.record('page', '/a', 30, { route: '/[slug]', cached: false });
		collector.record('page', '/b', 10, { route: '/[slug]', cached: true });

		const { pages } = collector.toData(context);
		assert.equal(pages.total, 2);
		assert.equal(pages.rendered, 1);
		assert.equal(pages.cached, 1);
		assert.equal(pages.entries[0].pathname, '/a');
	});

	it('splits page time into the component render and the pipeline around it', () => {
		const collector = new BuildTimingsCollector();

		collector.record('page-render', '/a', 24);
		collector.record('page', '/a', 30, { route: '/[slug]', cached: false });

		const { pages } = collector.toData(context);
		assert.ok(
			pages.componentDuration >= 24 && pages.componentDuration < 30,
			`expected the render to be attributed on its own, got ${pages.componentDuration}`,
		);
		assert.ok(pages.wallDuration > pages.componentDuration);
	});
});

describe('timings reports', () => {
	function populated() {
		const collector = new BuildTimingsCollector();
		collector.record('vite-hook', 'astro:markdown', 40, {
			hook: 'transform',
			module: '/project/src/pages/index.md',
		});
		collector.record('highlight', 'ts', 25, { chars: 120 });
		collector.record('markdown-file', '/project/src/pages/index.md', 60);
		collector.record('markdown-plugin', 'rehype-shiki', 25);
		collector.record('page', '/', 12, { route: '/', cached: false });
		collector.record('image', '/_astro/hero.webp', 8, { cached: false });
		collector.record('integration', '@astrojs/sitemap', 4, { hook: 'astro:build:done' });
		collector.record('astro-compile', '/project/src/pages/index.astro', 3);
		return collector.toData(context);
	}

	it('prints a section for every kind of measurement', () => {
		const report = renderCliReport(populated());

		for (const section of [
			'Vite plugins',
			'Astro compiler',
			'Markdown',
			'Syntax highlighting',
			'Slowest files to bundle',
			'Slowest pages',
			'Images',
			'Integrations',
		]) {
			assert.ok(report.includes(section), `expected the report to include "${section}"`);
		}
	});

	it('states that the numbers are wall clock rather than CPU time', () => {
		assert.match(renderCliReport(populated()), /Wall clock, not CPU time/);
	});

	it('renders a row whose value exceeds the largest one it is scaled against', () => {
		const collector = new BuildTimingsCollector();
		collector.record('page-render', '/a', 500);
		collector.record('page', '/a', 1, { route: '/', cached: false });

		assert.doesNotThrow(() => renderCliReport(collector.toData(context)));
	});

	it('omits sections that recorded nothing', () => {
		const report = renderCliReport(new BuildTimingsCollector().toData(context));

		assert.ok(!report.includes('Syntax highlighting'));
		assert.ok(!report.includes('Slowest pages'));
	});
});

describe('instrumentViteConfig', () => {
	it('records the hooks of nested and awaited plugins', async () => {
		const collector = new BuildTimingsCollector();
		const config = instrumentViteConfig(collector, {
			plugins: [
				{ name: 'sync-plugin', transform: (_code: string, id: string) => ({ code: id }) },
				[
					Promise.resolve({
						name: 'async-plugin',
						load: { filter: { id: /x/ }, handler: async (id: string) => id },
					}),
				],
				false,
			],
		} as any);

		const plugins = await Promise.all((config.plugins as any[]).flat());
		assert.deepEqual(plugins[0].transform('code', '/a.ts'), { code: '/a.ts' });
		assert.deepEqual(plugins[1].load.filter, { id: /x/ });
		await plugins[1].load.handler('/b.ts');

		const { plugins: recorded, modules } = collector.toData(context);
		assert.deepEqual(recorded.entries.map((plugin) => plugin.name).sort(), [
			'async-plugin',
			'sync-plugin',
		]);
		assert.deepEqual(modules.entries.map((module) => module.name).sort(), ['/a.ts', '/b.ts']);
	});

	it('does not charge a hook for resolution it delegates to other plugins', async () => {
		const collector = new BuildTimingsCollector();
		const config = instrumentViteConfig(collector, {
			plugins: [
				{
					name: 'delegating',
					async resolveId(this: any, source: string) {
						return this.resolve(source);
					},
				},
			],
		} as any);

		const pluginContext = {
			resolve: () => new Promise((resolve) => setTimeout(() => resolve({ id: '/x.ts' }), 60)),
		};
		await (config.plugins as any[])[0].resolveId.call(pluginContext, './x.ts');

		const { plugins } = collector.toData(context);
		assert.ok(
			plugins.entries[0].total < 30,
			`delegated time should not be charged to the caller, got ${plugins.entries[0].total}`,
		);
	});

	it('leaves plugins alone when a hook cannot be replaced', () => {
		const collector = new BuildTimingsCollector();
		const frozen = Object.freeze({ name: 'frozen', transform: () => undefined });

		const config = instrumentViteConfig(collector, { plugins: [frozen] } as any);

		assert.equal((config.plugins as any[])[0].transform, frozen.transform);
	});
});
