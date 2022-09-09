import { expect } from 'chai';
import { cachedCompilation } from '../../../dist/core/compile/index.js';
import { AggregateError } from '../../../dist/core/util.js';

describe('astro/src/core/compile', () => {
	describe('Invalid CSS', () => {
		it('throws an aggregate error with the errors', async () => {
			let error;
			try {
				let r = await cachedCompilation({
					config: /** @type {any} */ ({
						root: '/',
					}),
					filename: '/src/pages/index.astro',
					moduleId: '/src/pages/index.astro',
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
					transformStyle(source, lang) {
						throw new Error('Invalid css');
					},
				});
			} catch (err) {
				error = err;
			}

			expect(error).to.be.an.instanceOf(AggregateError);
			expect(error.errors[0].message).to.contain('Invalid css');
		});
	});
});
