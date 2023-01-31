import { expect } from 'chai';

describe('check', () => {
	it('should be able to load sass', async () => {
		let error = null;
		try {
			await import(new URL('../server-shim.js', import.meta.url));
			await import('sass');
		} catch (e) {
			error = e;
		}
		expect(error).to.be.null;
	});
});
