import { expect } from 'chai';
import { spawnSync } from 'child_process';
import { describe, it } from 'mocha';
import { check } from '../dist/index.js';

describe('astro-check - js api', async () => {
	it('can check a project', async () => {
		const hasError = await check({
			root: './fixture',
		});

		expect(hasError).to.not.be.undefined;
		expect(hasError).to.be.false;
	});

	// TODO: Test `watch` option once we have a way to pass a custom logger
});
