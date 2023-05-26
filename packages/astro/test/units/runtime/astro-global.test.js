import { expect } from 'chai';
import { createAstro } from '../../../dist/runtime/server/index.js';

describe('astro global', () => {
	it('Glob should error if passed incorrect value', async () => {
		const Astro = createAstro(undefined);
		expect(() => {
			Astro.glob('./**/*.md');
		}).to.throw(
			'Astro.glob() does not work outside of an Astro file. Use `import.meta.glob()` instead.'
		);
	});
});
