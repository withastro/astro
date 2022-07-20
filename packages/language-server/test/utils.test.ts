import { expect } from 'chai';
import { isAstroWorkspace } from '../src/utils';

describe('Utilities', () => {
	it('isAstroWorkspace', () => {
		const astroWorkspace = isAstroWorkspace('./test/fixtures/astro-workspace');
		const notAstroWorkspace = isAstroWorkspace('./test/fixtures/not-astro-workspace');

		expect(astroWorkspace).to.be.true;
		expect(notAstroWorkspace).to.be.false;
	});
});
