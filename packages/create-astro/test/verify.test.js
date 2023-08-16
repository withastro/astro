import { expect } from 'chai';

import { verify } from '../dist/index.js';
import { setup } from './utils.js';

describe('verify', () => {
	const fixture = setup();
	const exit = (code) => {
		throw code;
	};

	it('basics', async () => {
		const context = { template: 'basics', exit };
		await verify(context);
		expect(fixture.messages().length).to.equal(0, 'Did not expect `verify` to log any messages');
	});

	it('missing', async () => {
		const context = { template: 'missing', exit };
		let err = null;
		try {
			await verify(context);
		} catch (e) {
			err = e;
		}
		expect(err).to.eq(1);
		expect(fixture.hasMessage('Template missing does not exist!'));
	});

	it('starlight', async () => {
		const context = { template: 'starlight', exit };
		await verify(context);
		expect(fixture.messages().length).to.equal(0, 'Did not expect `verify` to log any messages');
	});

	it('starlight/tailwind', async () => {
		const context = { template: 'starlight/tailwind', exit };
		await verify(context);
		expect(fixture.messages().length).to.equal(0, 'Did not expect `verify` to log any messages');
	});
});
