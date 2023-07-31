import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import os from 'node:os';
import path from 'node:path';
import { AstroCheck, CheckResult } from '../../dist/check.js';

describe('AstroCheck', async () => {
	let checker: AstroCheck;
	let result: CheckResult;

	before(async function () {
		// First init can sometimes be slow in CI, even though the rest of the tests will be fast.
		this.timeout(50000);
		checker = new AstroCheck(
			path.resolve(__dirname, 'fixture'),
			require.resolve('typescript/lib/tsserverlibrary.js'),
			undefined
		);
		result = await checker.lint({});
	});

	it('Can check files and return errors', async () => {
		expect(result).to.not.be.undefined;
		expect(result.fileResult).to.have.lengthOf(3);
	});

	it("Returns the file's URL", async () => {
		expect(result.fileResult[0].fileUrl).to.not.be.undefined;
		expect(result.fileResult[0].fileUrl instanceof URL).to.be.true;
	});

	it("Returns the file's content", async () => {
		expect(result.fileResult[0].fileContent).to.not.be.undefined;
		expect(result.fileResult[0].fileContent).to.deep.equal(
			`---${os.EOL}console.log(doesntExist);${os.EOL}---${os.EOL}`
		);
	});

	it('Can return the total amount of errors, warnings and hints', async () => {
		expect(result.errors).to.equal(1);
		expect(result.warnings).to.equal(1);
		expect(result.hints).to.equal(1);
	});

	it('Can return the total amount of files checked', async () => {
		expect(result.fileChecked).to.equal(4);
	});

	it('Can return the status of the check', async () => {
		expect(result.status).to.equal('completed');
	});
});
