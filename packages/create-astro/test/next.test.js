import { expect } from 'chai';

import { next } from '../dist/index.js';
import { setup } from './utils.js';

describe('next steps', () => {
	const fixture = setup();

	it('no arguments', async () => {
		await next({ skipHouston: false, cwd: './it/fixtures/not-empty', packageManager: 'npm' });
		expect(fixture.hasMessage('Liftoff confirmed.')).to.be.true;
		expect(fixture.hasMessage('npm run dev')).to.be.true;
		expect(fixture.hasMessage('Good luck out there, astronaut!')).to.be.true;
	});

	it('--skip-houston', async () => {
		await next({ skipHouston: true, cwd: './it/fixtures/not-empty', packageManager: 'npm' });
		expect(fixture.hasMessage('Good luck out there, astronaut!')).to.be.false;
	});
});
