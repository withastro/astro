import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const binPath = fileURLToPath(new URL('../bin/astro-check.js', import.meta.url));
const fixturePath = fileURLToPath(new URL('./fixture', import.meta.url));

function runBinary(args: string[], cwd = fixturePath) {
	return spawnSync(process.execPath, [binPath, ...args], {
		cwd,
		// The built CLI does not need the test runner's cwd-relative tsx preload.
		env: { ...process.env, NODE_OPTIONS: '', FORCE_COLOR: '1' },
		encoding: 'utf8',
	});
}

describe('astro-check - binary', async () => {
	it('Can run the binary', async () => {
		const childProcess = spawnSync('node', [binPath], {
			// Set the working directory to the fixture directory so that `astro check` can use the tsconfig in the fixture directory.
			cwd: fixturePath,
		});

		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 1);
		assert.ok(childProcess.stdout.toString().includes('Getting diagnostics for Astro files in'));
		assert.ok(childProcess.stdout.toString().includes('1 error'));
		assert.ok(childProcess.stdout.toString().includes('1 warning'));
		assert.ok(childProcess.stdout.toString().includes('1 hint'));
	});

	it('Parses the first command-line argument', async () => {
		const childProcess = spawnSync('node', [binPath, '--help'], {
			cwd: fixturePath,
		});

		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 0);
		assert.ok(childProcess.stdout.toString().includes('--tsconfig'));
		assert.ok(!childProcess.stdout.toString().includes('Getting diagnostics for Astro files in'));
	});

	it('Requires a report file path', () => {
		const childProcess = spawnSync(process.execPath, [binPath, '--reporter-file'], {
			encoding: 'utf8',
		});

		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 1);
		assert.match(childProcess.stderr, /Not enough arguments following: reporter-file/);
		assert.ok(!childProcess.stdout.includes('Getting diagnostics for Astro files in'));
	});

	it('Rejects an unknown reporter before checking files', () => {
		const childProcess = runBinary(['--reporter', 'unknown']);
		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 1);
		assert.match(childProcess.stderr, /reporter/i);
		assert.strictEqual(childProcess.stdout, '');
	});

	it('Writes each structured format to stdout without terminal output', () => {
		for (const reporter of ['json', 'sarif', 'junit', 'checkstyle']) {
			const childProcess = runBinary(['--reporter', reporter, '--minimumSeverity', 'error']);
			assert.ifError(childProcess.error);
			assert.strictEqual(childProcess.status, 1, childProcess.stderr);
			assert.strictEqual(childProcess.stdout, stripVTControlCharacters(childProcess.stdout));
			assert.ok(childProcess.stdout.endsWith('\n'));
			assert.ok(!childProcess.stdout.includes('Getting diagnostics for Astro files in'));
			if (reporter === 'json') {
				const report = JSON.parse(childProcess.stdout);
				assert.deepStrictEqual(report.summary, { errors: 1, warnings: 1, hints: 1 });
				assert.strictEqual(report.diagnostics.length, 1);
			} else if (reporter === 'sarif') {
				assert.strictEqual(JSON.parse(childProcess.stdout).runs[0].results.length, 1);
			} else {
				assert.strictEqual(XMLValidator.validate(childProcess.stdout), true);
				const report = new XMLParser({ ignoreAttributes: false }).parse(childProcess.stdout);
				if (reporter === 'checkstyle') {
					assert.strictEqual(report.checkstyle.file.error['@_severity'], 'error');
				} else {
					assert.strictEqual(report.testsuites.testsuite['@_failures'], '1');
				}
			}
		}
	});

	it('Writes a filtered plain report relative to cwd without terminal output', (t) => {
		const cwd = mkdtempSync(path.join(tmpdir(), 'astro-check-report-'));
		t.after(() => rmSync(cwd, { recursive: true, force: true }));
		const childProcess = runBinary(
			[
				'--root',
				fixturePath,
				'--reporter-file',
				'reports/astro check.txt',
				'--minimumSeverity',
				'warning',
			],
			cwd,
		);

		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 1, childProcess.stderr);
		const report = readFileSync(path.join(cwd, 'reports/astro check.txt'), 'utf8');
		assert.strictEqual(childProcess.stdout, '');
		assert.strictEqual(report, stripVTControlCharacters(report));
		assert.ok(report.endsWith('\n'));
		assert.ok(report.includes('fileWithErrors.astro'));
		assert.ok(report.includes('fileWithWarnings.astro'));
		assert.ok(!report.includes('fileWithHints.astro'));
		assert.ok(report.includes('1 error'));
		assert.ok(report.includes('1 warning'));
		assert.ok(!report.includes('1 hint'));
	});

	it('Writes structured output only to its requested file', (t) => {
		const cwd = mkdtempSync(path.join(tmpdir(), 'astro-check-report-'));
		t.after(() => rmSync(cwd, { recursive: true, force: true }));
		const childProcess = runBinary(
			['--root', fixturePath, '--reporter=json', '--reporter-file=reports/check.json'],
			cwd,
		);
		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 1, childProcess.stderr);
		assert.strictEqual(childProcess.stdout, '');
		const report = JSON.parse(readFileSync(path.join(cwd, 'reports/check.json'), 'utf8'));
		assert.deepStrictEqual(report.summary, { errors: 1, warnings: 1, hints: 1 });
	});

	it('Prints diagnostics and a summary for each repeated default reporter', () => {
		const childProcess = runBinary(['--reporter=default', '--reporter=default']);
		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 1, childProcess.stderr);
		const output = stripVTControlCharacters(childProcess.stdout);
		assert.strictEqual(output.split('Cannot find name').length - 1, 2);
		assert.strictEqual(output.split('Result (').length - 1, 2);
	});

	it('Keeps default terminal diagnostics when explicitly combined with a saved SARIF report', (t) => {
		const cwd = mkdtempSync(path.join(tmpdir(), 'astro-check-report-'));
		t.after(() => rmSync(cwd, { recursive: true, force: true }));
		const childProcess = runBinary(
			[
				'--root',
				fixturePath,
				'--reporter=default',
				'--reporter=sarif',
				'--reporter-file=check.sarif',
			],
			cwd,
		);
		assert.ifError(childProcess.error);
		assert.strictEqual(childProcess.status, 1, childProcess.stderr);
		const consoleOutput = stripVTControlCharacters(childProcess.stdout);
		assert.ok(consoleOutput.includes('Getting diagnostics for Astro files in'));
		assert.ok(consoleOutput.includes('Cannot find name'));
		assert.ok(consoleOutput.includes('1 error'));
		assert.notStrictEqual(childProcess.stdout, consoleOutput);
		const report = JSON.parse(readFileSync(path.join(cwd, 'check.sarif'), 'utf8'));
		assert.strictEqual(report.version, '2.1.0');
		assert.strictEqual(report.runs[0].results.length, 3);
	});
});
