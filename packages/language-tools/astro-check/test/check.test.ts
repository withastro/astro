import assert from 'node:assert';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AstroCheck } from '@astrojs/language-server';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { check } from '../dist/index.js';

describe('astro-check - js api', async () => {
	it('can check a project', async () => {
		const hasError = await check({
			root: './fixture',
			tsconfig: path.resolve(process.cwd(), './test/fixture/tsconfig.json'),
		});

		assert.notStrictEqual(hasError, undefined);
		assert.strictEqual(hasError, true);
	});

	it('Validates report options before initializing the checker', async () => {
		const tsconfig = 'missing-check-config.json';
		await assert.rejects(
			check({ reporter: 'unknown' as 'json', reporterFile: 'unused.json', tsconfig }),
			/reporter/i,
		);
		await assert.rejects(check({ reporters: [], tsconfig }), /reporter/i);
		await assert.rejects(
			check({ reporter: 'json', reporters: [{ reporter: 'sarif' }], tsconfig }),
			/reporter/i,
		);
	});

	it('Writes each structured format from real diagnostics without changing failure status', async (t) => {
		const directory = mkdtempSync(path.join(tmpdir(), 'astro-check-reports-'));
		t.after(() => rmSync(directory, { recursive: true, force: true }));
		const root = fileURLToPath(new URL('./fixture/', import.meta.url));
		for (const reporter of ['json', 'sarif', 'junit', 'checkstyle'] as const) {
			const reporterFile = path.join(directory, `report.${reporter}`);
			assert.strictEqual(
				await check({ root, reporter, reporterFile, minimumSeverity: 'error' }),
				true,
			);
			const output = readFileSync(reporterFile, 'utf8');
			assert.ok(output.endsWith('\n'));
			assert.ok(!output.includes('\u001b'));
			if (reporter === 'json') {
				assert.strictEqual(JSON.parse(output).diagnostics.length, 1);
			} else if (reporter === 'sarif') {
				assert.strictEqual(JSON.parse(output).runs[0].results.length, 1);
			} else {
				assert.strictEqual(XMLValidator.validate(output), true);
				const report = new XMLParser({ ignoreAttributes: false }).parse(output);
				if (reporter === 'checkstyle') {
					assert.strictEqual(report.checkstyle.file.error['@_severity'], 'error');
				} else {
					const suite = report.testsuites?.testsuite ?? report.testsuite;
					assert.strictEqual(suite['@_failures'], '1');
				}
			}
		}
	});

	it('Writes multiple report destinations from one completed check', async (t) => {
		const directory = mkdtempSync(path.join(tmpdir(), 'astro-check-reports-'));
		t.after(() => rmSync(directory, { recursive: true, force: true }));
		const jsonFile = path.join(directory, 'json', 'report.json');
		const sarifFile = path.join(directory, 'sarif', 'report.sarif');
		const hasError = await check({
			root: fileURLToPath(new URL('./fixture/', import.meta.url)),
			reporters: [
				{ reporter: 'json', reporterFile: jsonFile },
				{ reporter: 'sarif', reporterFile: sarifFile },
			],
			minimumSeverity: 'error',
		});
		assert.strictEqual(hasError, true);
		const json = JSON.parse(readFileSync(jsonFile, 'utf8'));
		const sarif = JSON.parse(readFileSync(sarifFile, 'utf8'));
		assert.strictEqual(json.diagnostics.length, 1);
		assert.strictEqual(sarif.runs[0].results.length, 1);
		assert.strictEqual(json.diagnostics[0].message, sarif.runs[0].results[0].message.text);
	});

	it('Overwrites the report when a subsequent check succeeds', async (t) => {
		const root = mkdtempSync(path.join(tmpdir(), 'astro-check-report-'));
		t.after(() => rmSync(root, { recursive: true, force: true }));
		const tsconfig = path.join(root, 'tsconfig.json');
		const reporterFile = path.join(root, 'report.txt');
		const fixturePath = fileURLToPath(new URL('./fixture/', import.meta.url));
		writeFileSync(tsconfig, JSON.stringify({ include: ['./*.astro'] }));
		copyFileSync(path.join(fixturePath, 'fileWithErrors.astro'), path.join(root, 'page.astro'));

		assert.strictEqual(await check({ root, tsconfig, reporterFile }), true);
		assert.ok(readFileSync(reporterFile, 'utf8').includes('1 error'));

		rmSync(path.join(root, 'page.astro'));
		copyFileSync(path.join(fixturePath, 'fileWithNoErrors.astro'), path.join(root, 'clean.astro'));
		assert.strictEqual(await check({ root, tsconfig, reporterFile }), false);
		const report = readFileSync(reporterFile, 'utf8');
		assert.match(report, /^Result \(1 file\):/);
		assert.ok(report.includes('0 errors'));
		assert.ok(!report.includes('Cannot find name'));
		assert.ok(report.endsWith('\n'));
	});

	it('Rejects with the report path when the destination cannot be written', async (t) => {
		const root = mkdtempSync(path.join(tmpdir(), 'astro-check-report-'));
		t.after(() => rmSync(root, { recursive: true, force: true }));
		writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify({ include: ['./*.astro'] }));
		copyFileSync(
			new URL('./fixture/fileWithNoErrors.astro', import.meta.url),
			path.join(root, 'page.astro'),
		);
		const reporterFile = path.join(root, 'parent-file', 'report.txt');
		writeFileSync(path.dirname(reporterFile), 'existing file');

		await assert.rejects(check({ root, reporterFile }), (error: Error) => {
			assert.ok(error.message.includes(reporterFile));
			assert.match(error.message, /write.*report|report.*write/i);
			return true;
		});
	});

	it('Preserves the last complete report when diagnostics are cancelled', async (t) => {
		const root = mkdtempSync(path.join(tmpdir(), 'astro-check-report-'));
		t.after(() => rmSync(root, { recursive: true, force: true }));
		const reporterFile = path.join(root, 'report.txt');
		writeFileSync(reporterFile, 'Previous complete report\n');
		t.mock.method(AstroCheck.prototype, 'lint', async () => ({
			status: 'cancelled',
			fileChecked: 1,
			errors: 1,
			warnings: 0,
			hints: 0,
			fileResult: [{ text: 'Incomplete diagnostics' }],
		}));

		await check({
			root: fileURLToPath(new URL('./fixture/', import.meta.url)),
			reporter: 'json',
			reporterFile,
		});
		assert.strictEqual(readFileSync(reporterFile, 'utf8'), 'Previous complete report\n');
	});

	it('Does not emit a cancelled structured report to stdout', async (t) => {
		t.mock.method(AstroCheck.prototype, 'lint', async () => ({
			status: 'cancelled',
			fileChecked: 1,
			errors: 1,
			warnings: 0,
			hints: 0,
			fileResult: [],
		}));
		const stdout = t.mock.method(process.stdout, 'write', () => true);
		const info = t.mock.method(console, 'info', () => {});
		await check({
			root: fileURLToPath(new URL('./fixture/', import.meta.url)),
			reporter: 'json',
		});
		assert.strictEqual(stdout.mock.callCount(), 0);
		assert.strictEqual(info.mock.callCount(), 0);
	});
});
