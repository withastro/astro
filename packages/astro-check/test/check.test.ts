import path from 'path';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { check } from '../dist/index.js';

describe('astro-check - js api', async () => {
	it('can check a project', async () => {
		const hasError = await check({
			root: './fixture',
			tsconfig: path.resolve(process.cwd(), './test/fixture/tsconfig.json'),
		});

		expect(hasError).to.not.be.undefined;
		expect(hasError).to.be.true;
	});

	// TODO: Test `watch` option once we have a way to pass a custom logger
});
