import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/no-output/', import.meta.url);

describe('MissingOutputConfig', () => {
	it('throws during the build', async () => {
		let error = undefined;
		try {
			await astroCli(fileURLToPath(root), 'build');
		} catch (err) {
			error = err;
		}
		expect(error).to.not.be.equal(undefined);
		expect(error.message).to.include(`output: "server"`);
	});
});
