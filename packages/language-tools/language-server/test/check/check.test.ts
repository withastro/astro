import assert from 'node:assert';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { CheckResult } from '../../dist/check.js';
import { AstroCheck } from '../../dist/check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const checkFixtureDir = path.resolve(__dirname, 'fixture');
const minifiedFixtureDir = path.resolve(__dirname, 'fixture-minified');

describe('AstroCheck', async () => {
	let checker: AstroCheck;
	let result: CheckResult;

	before(async () => {
		checker = new AstroCheck(
			checkFixtureDir,
			require.resolve('typescript/lib/typescript.js'),
			undefined,
		);
		result = await checker.lint({});
	});

	it('Can check files and return errors', async () => {
		assert.notStrictEqual(result, undefined);
		assert.strictEqual(result.fileResult.length, 4);
	});

	it("Returns the file's URL", async () => {
		assert.notStrictEqual(result.fileResult[0].fileUrl, undefined);
		assert.strictEqual(result.fileResult[0].fileUrl instanceof URL, true);
	});

	it("Returns the file's content", async () => {
		assert.notStrictEqual(result.fileResult[0].fileContent, undefined);
		assert.deepStrictEqual(
			result.fileResult[0].fileContent,
			`---${os.EOL}console.log(doesntExist);${os.EOL}---${os.EOL}`,
		);
	});

	it('Can return the total amount of errors, warnings and hints', async () => {
		assert.strictEqual(result.errors, 2);
		assert.strictEqual(result.warnings, 1);
		assert.strictEqual(result.hints, 1);
	});

	it('Can return the total amount of files checked', async () => {
		assert.strictEqual(result.fileChecked, 6);
	});

	it('Can return the status of the check', async () => {
		assert.strictEqual(result.status, 'completed');
	});
});

describe('AstroCheck - minified files', async () => {
	let checker: AstroCheck;
	let result: CheckResult;

	before(async () => {
		checker = new AstroCheck(
			minifiedFixtureDir,
			require.resolve('typescript/lib/typescript.js'),
			undefined,
		);
		result = await checker.lint({ logErrors: { level: 'hint' } });
	});

	it('Completes without OOM when checking files with very long lines', async () => {
		assert.strictEqual(result.status, 'completed');
	});

	it('Skips detailed formatting for minified files', async () => {
		const minifiedResult = result.fileResult.find((r) =>
			r.fileUrl.pathname.endsWith('minified.mjs'),
		);
		if (minifiedResult) {
			assert.ok(
				minifiedResult.text.includes('detailed output skipped'),
				'Should indicate that detailed output was skipped for minified file',
			);
		}
	});
});
