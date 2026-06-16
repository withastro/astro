import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from 'vite';
import { compile } from '../../dist/compile/index.js';
import { AggregateError } from '../../dist/errors.js';
import type { AstroConfigLike as AstroConfig } from '../../dist/types.js';

describe('vite-plugin-astro/compile', () => {
	describe('Invalid CSS', () => {
		it('throws an aggregate error with the errors', async () => {
			let error;
			try {
				await compile({
					astroConfig: {
						root: pathToFileURL('/'),
					} as AstroConfig,
					viteConfig: await resolveConfig({ configFile: false }, 'serve'),
					annotateSourceFile: false,
					filename: '/src/pages/index.astro',
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
