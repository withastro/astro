import { expect } from 'chai';
import { createAstro } from '../../../dist/runtime/server/index.js';

describe('astro global', () => {
	it('Glob should error if passed incorrect value', async () => {
		const Astro = createAstro(undefined);
		expect(() => {
			Astro.glob('./**/*.md');
		}).to.throw(/does not work outside of an Astro file/);
	});

	it('Glob should error if has no results', async () => {
		const Astro = createAstro(undefined);
		expect(() => {
			Astro.glob([], () => './**/*.md');
		}).to.throw(/does not match any files/);
	});
});
