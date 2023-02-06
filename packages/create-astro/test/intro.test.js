import { expect } from 'chai';

import { intro } from '../dist/index.js';
import { setup } from './utils.js';

describe('intro', () => {
	const fixture = setup();

	it('no arguments', async () => {
		await intro({ skipHouston: false, version: '0.0.0', username: 'user' });
		expect(fixture.hasMessage('Houston:')).to.be.true;
		expect(fixture.hasMessage('Welcome to  astro  v0.0.0')).to.be.true;
	});
	it('--skip-houston', async () => {
		await intro({ skipHouston: true, version: '0.0.0', username: 'user' });
		expect(fixture.length()).to.eq(1);
		expect(fixture.hasMessage('Houston:')).to.be.false;
		expect(fixture.hasMessage('Launch sequence initiated')).to.be.true;
	});
});
