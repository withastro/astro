import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseArgsAsCheckConfig } from '../dist/index.js';

describe('astro-check - Arguments parser', async () => {
	it('Can parse an empty array', async () => {
		const result = parseArgsAsCheckConfig([]);

		assert.strictEqual(result.watch, false);
		assert.strictEqual(result.tsconfig, undefined);
		assert.deepStrictEqual(result.reporters, [{ reporter: 'default' }]);
		assert.strictEqual(result.minimumSeverity, 'hint');
		assert.strictEqual(result.preserveWatchOutput, false);
	});

	it('Can parse boolean', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--watch', '--preserveWatchOutput']);
		assert.strictEqual(result.watch, true);
		assert.strictEqual(result.preserveWatchOutput, true);
	});

	it('Can parse string', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--root', 'foo']);
		assert.strictEqual(result.root, 'foo');
	});

	it('Parses the report file path in kebab-case and camelCase', () => {
		for (const flag of ['--reporter-file', '--reporterFile']) {
			const result = parseArgsAsCheckConfig(['', '', flag, 'reports/astro check.txt']);
			assert.deepStrictEqual(result.reporters, [
				{ reporter: 'default', reporterFile: 'reports/astro check.txt' },
			]);
		}
	});

	it('Can parse string with choice', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--minimumSeverity', 'error']);
		assert.strictEqual(result.minimumSeverity, 'error');
	});

	it('Parses each report format with its destination', () => {
		for (const reporter of ['default', 'json', 'sarif', 'junit', 'checkstyle']) {
			const result = parseArgsAsCheckConfig([
				'',
				'',
				'--reporter',
				reporter,
				'--reporter-file',
				'report.txt',
			]);
			assert.deepStrictEqual(result.reporters, [{ reporter, reporterFile: 'report.txt' }]);
		}
	});

	it('Parses explicit terminal output and multiple file destinations', () => {
		const result = parseArgsAsCheckConfig([
			'',
			'',
			'--reporter=default',
			'--reporter=json',
			'--reporter-file=report.json',
			'--reporter-file=report.sarif',
			'--reporter=sarif',
		]);
		assert.deepStrictEqual(result.reporters, [
			{ reporter: 'default' },
			{ reporter: 'json', reporterFile: 'report.json' },
			{ reporter: 'sarif', reporterFile: 'report.sarif' },
		]);
		assert.ok(!('reporter' in result));
		assert.ok(!('reporterFile' in result));
	});
});
