import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Public', () => {
	let fixture;
	let routes;

	const integration = {
		name: 'test-custom-page-options',
		hooks: {
			['astro:build:done']: (options) => {
				routes = options.routes;
			},
		},
	}

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-page-options/',
			integrations: [integration],
		});
		await fixture.build();
	});

	it('sets custom options', async () => {
		const page = routes.find(r => r.pathname === '/');
		expect(page.customOptions).to.deep.equal({
			customTrue: true,
			customFalse: false,
			// customString: 'string',
			// customString2: 'string2',
			// customNumber: 123,
			// customNumber2: -123.456,
			// customHexNumber: 0xa,
			// customOctalNumber: 0o10,
			// customBinaryNumber: 0b1010,
		});
	});
});
