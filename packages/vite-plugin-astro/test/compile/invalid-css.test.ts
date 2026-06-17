import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveConfig } from 'vite';
import { compile } from '../../dist/compile/index.js';
import { defaultErrorHandler } from '../../dist/errors.js';

describe('vite-plugin-astro/compile', () => {
	describe('Invalid CSS', () => {
		it('throws an aggregate error with the errors', async () => {
			let error;
			try {
				await compile({
					viteConfig: await resolveConfig({ configFile: false }, 'serve'),
					annotateSourceFile: false,
					filename: '/src/pages/index.astro',
					handleError: defaultErrorHandler,
					source: `
---
---
<style lang="scss">
	article:global(:is(h1, h2, h3, h4, h5, h6):hover {
		color: purple;
	}
</style>
<style lang="scss">
	article:is(h1, h2, h3, h4, h5, h6:hover {
		color: purple;
	}
</style>
`,
				});
			} catch (err) {
				error = err;
			}

			assert.equal(error instanceof AggregateError, true);
			assert.equal((error as AggregateError).errors[0].message.includes('expected ")"'), true);
		});
	});
});
