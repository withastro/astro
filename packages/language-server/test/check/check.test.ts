import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { CheckResult } from '../../dist/check.js';
import { AstroCheck } from '../../dist/check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const checkFixtureDir = path.resolve(__dirname, 'fixture');

describe('AstroCheck', async () => {
	let checker: AstroCheck;
	let result: CheckResult;

	before(async function () {
		// First init can sometimes be slow in CI, even though the rest of the tests will be fast.
		this.timeout(50000);
		checker = new AstroCheck(
			checkFixtureDir,
			require.resolve('typescript/lib/typescript.js'),
			undefined,
		);
		result = await checker.lint({});
	});

	it('Can check files and return errors', async () => {
		expect(result).to.not.be.undefined;
		expect(result.fileResult).to.have.lengthOf(4);
	});

	it("Returns the file's URL", async () => {
		expect(result.fileResult[0].fileUrl).to.not.be.undefined;
		expect(result.fileResult[0].fileUrl instanceof URL).to.be.true;
	});

	it("Returns the file's content", async () => {
		expect(result.fileResult[0].fileContent).to.not.be.undefined;
		expect(result.fileResult[0].fileContent).to.deep.equal(
			`---${os.EOL}console.log(doesntExist);${os.EOL}---${os.EOL}`,
		);
	});

	it('Can return the total amount of errors, warnings and hints', async () => {
		expect(result.errors).to.equal(2);
		expect(result.warnings).to.equal(1);
		expect(result.hints).to.equal(1);
	});

	it('Can return the total amount of files checked', async () => {
		expect(result.fileChecked).to.equal(6);
	});

	it('Can return the status of the check', async () => {
		expect(result.status).to.equal('completed');
	});
});
