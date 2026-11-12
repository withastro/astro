import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { svgoOptimizer } from '../../../dist/assets/svg/svgo.js';

describe('svgoOptimizer', () => {
	it('does not load svgo when importing astro/config', () => {
		const entrypoint = new URL('../../../dist/config/entrypoint.js', import.meta.url).href;
		const script = `
			import { registerHooks } from 'node:module';
			let loaded = false;
			registerHooks({
				load(url, ctx, next) {
					if (/node_modules\\/svgo\\//.test(url)) loaded = true;
					return next(url, ctx);
				},
			});
			await import(${JSON.stringify(entrypoint)});
			process.stdout.write(String(loaded));
		`;
		const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
			encoding: 'utf-8',
		});
		assert.equal(output.trim(), 'false');
	});

	it('optimizes SVG contents', async () => {
		const optimizer = svgoOptimizer();
		const result = await optimizer.optimize(
			'<svg xmlns="http://www.w3.org/2000/svg"><!-- comment --><rect width="10" height="10"/></svg>',
			'/icon.svg',
		);
		assert.equal(result, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10H0z"/></svg>');
	});
});
