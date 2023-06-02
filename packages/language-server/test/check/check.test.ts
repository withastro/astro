import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import os from 'node:os';
import path from 'node:path';
import { AstroCheck, CheckResult } from '../../dist/check.js';

describe('AstroCheck', async () => {
	let checker: AstroCheck;
	let errors: CheckResult[];

	before(async function () {
		// First init can sometimes be slow in CI, even though the rest of the tests will be fast.
		this.timeout(50000);
		checker = new AstroCheck(
			path.resolve(__dirname, 'fixture'),
			require.resolve('typescript/lib/tsserverlibrary.js')
		);
		errors = await checker.lint(undefined, false);
	});

	it('Can check files and return errors', async () => {
		expect(errors).to.not.be.undefined;
		expect(errors).to.have.lengthOf(1);
	});

	it("Returns the file's URL", async () => {
		expect(errors[0].fileUrl).to.not.be.undefined;
		expect(errors[0].fileUrl instanceof URL).to.be.true;
	});

	it("Returns the file's content", async () => {
		expect(errors[0].fileContent).to.not.be.undefined;
		expect(errors[0].fileContent).to.deep.equal(
			`---${os.EOL}console.log(doesntExist);${os.EOL}---${os.EOL}`
		);
	});
});
