import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svgoOptimizer } from '../../../dist/assets/svg/svgo.js';

describe('svgo optimizer', () => {
	it('does not load svgo when importing astro/config', () => {
		const entrypointPath = fileURLToPath(
			new URL('../../../dist/config/entrypoint.js', import.meta.url),
		);
		const entrypointUrl = pathToFileURL(entrypointPath).href;

		const script = `
			import { registerHooks } from 'node:module';
			let loadedSvgo = false;
			registerHooks({
				load(url, ctx, next) {
					if (url.includes('node_modules/svgo/') || url.includes('node_modules\\\\svgo\\\\')) {
						loadedSvgo = true;
					}
					return next(url, ctx);
				}
			});
			await import(${JSON.stringify(entrypointUrl)});
			if (loadedSvgo) {
				process.exit(1);
			}
		`;

		execFileSync(process.execPath, ['--input-type=module', '-e', script], {
			encoding: 'utf-8',
		});
	});

	it('optimizes SVG contents', async () => {
		const optimizer = svgoOptimizer();
		assert.equal(optimizer.name, 'svgo');

		const svg = '<svg viewBox="0 0 100 100"><!-- comment --><path d="M0 0h10v10H0z"/></svg>';
		const result = await optimizer.optimize(svg, '/test.svg');

		assert.ok(result);
		assert.ok(result.includes('<path'));
		assert.ok(!result.includes('<!-- comment -->'), 'comments should be stripped');
	});

	it('forwards custom config options', async () => {
		const optimizer = svgoOptimizer({
			js2svg: { indent: 2, pretty: true },
		});
		const svg = '<svg viewBox="0 0 100 100"><rect width="10" height="10"/></svg>';
		const result = await optimizer.optimize(svg, '/test.svg');

		assert.ok(result);
		assert.ok(result.includes('\n'), 'pretty config should format with newlines');
	});
});
