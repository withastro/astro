import { expect } from 'chai';
import { spawnSync } from 'child_process';
import { describe, it } from 'mocha';

describe('astro-check - binary', async () => {
	it('Can run the binary', async () => {
		const childProcess = spawnSync('node', ['../dist/bin.js', '--root', './fixture'], {
			cwd: __dirname,
		});

		expect(childProcess.status).to.equal(1);
		expect(childProcess.stdout.toString()).to.contain('Getting diagnostics for Astro files in');
		expect(childProcess.stdout.toString()).to.contain('1 error');
		expect(childProcess.stdout.toString()).to.contain('1 warning');
		expect(childProcess.stdout.toString()).to.contain('1 hint');
	});
});
