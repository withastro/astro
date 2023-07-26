import { expect } from 'chai';

describe('Import astro/app', async () => {

	it('Successfully imports astro/app', async () => {
		try {
			await import('astro/app');
			expect(true).to.be.true;
		} catch (err) {
			expect.fail(undefined, undefined, `Importing astro/app should not throw an error: ${err}`);
		}
	});
});
