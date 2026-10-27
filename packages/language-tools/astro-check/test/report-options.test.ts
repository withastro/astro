import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	parseReportTargets,
	type ReportTarget,
	resolveReportTargets,
} from '../dist/report-options.js';

describe('astro-check - report destinations', () => {
	it('Defaults to human output on stdout', () => {
		assert.deepEqual(parseReportTargets([]), [{ reporter: 'default' }]);
		assert.deepEqual(resolveReportTargets({}), [{ reporter: 'default' }]);
	});

	it('Routes a single reporter to stdout or its file', () => {
		assert.deepEqual(parseReportTargets(['--reporter=json']), [{ reporter: 'json' }]);
		assert.deepEqual(parseReportTargets(['--reporter=json', '--reporter-file=result.json']), [
			{ reporter: 'json', reporterFile: 'result.json' },
		]);
		assert.deepEqual(parseReportTargets(['--reporter-file=result.txt']), [
			{ reporter: 'default', reporterFile: 'result.txt' },
		]);
	});

	it('Pairs adjacent reporter and file options in either order', () => {
		const expected = [
			{ reporter: 'default' },
			{ reporter: 'sarif', reporterFile: 'results.sarif' },
		];
		assert.deepEqual(
			parseReportTargets([
				'--reporter=default',
				'--reporter=sarif',
				'--reporter-file=results.sarif',
			]),
			expected,
		);
		assert.deepEqual(
			parseReportTargets([
				'--reporter=default',
				'--root=site',
				'--reporterFile',
				'results.sarif',
				'--reporter',
				'sarif',
			]),
			expected,
		);
	});

	it('Starts a separate destination when another argument interrupts a pair', () => {
		for (const argument of ['--watch', '--root=site', 'check']) {
			assert.deepEqual(
				parseReportTargets(['--reporter=json', argument, '--reporter-file=results.txt']),
				[{ reporter: 'json' }, { reporter: 'default', reporterFile: 'results.txt' }],
			);
		}
	});

	it('Keeps repeated stdout and file destinations in argument order', () => {
		assert.deepEqual(
			parseReportTargets([
				'--reporter=json',
				'--reporter=json',
				'--reporter-file=same.json',
				'--reporter-file=same.json',
				'--reporter=sarif',
			]),
			[
				{ reporter: 'json' },
				{ reporter: 'json', reporterFile: 'same.json' },
				{ reporter: 'sarif', reporterFile: 'same.json' },
			],
		);
	});

	it('Does not interpret option values or arguments after -- as reporter options', () => {
		assert.deepEqual(parseReportTargets(['--root=--reporter=json']), [{ reporter: 'default' }]);
		assert.deepEqual(parseReportTargets(['--reporter-file=--reporter=json']), [
			{ reporter: 'default', reporterFile: '--reporter=json' },
		]);
		assert.deepEqual(parseReportTargets(['--reporterFile', 'results=--reporter=json']), [
			{ reporter: 'default', reporterFile: 'results=--reporter=json' },
		]);
		assert.deepEqual(parseReportTargets(['--reporter=json', '--', '--reporter=sarif']), [
			{ reporter: 'json' },
		]);
	});

	it('Preserves dash-prefixed numeric file paths accepted by the CLI parser', () => {
		for (const reporterFile of ['-1', '-.1', '-1e3', '-0x1']) {
			assert.deepEqual(parseReportTargets(['--reporter-file', reporterFile]), [
				{ reporter: 'default', reporterFile },
			]);
		}
	});

	it('Rejects missing option values, empty file paths, and unknown formats', () => {
		for (const args of [
			['--reporter'],
			['--reporter-file'],
			['--reporter', '--watch'],
			['--reporter-file='],
			['--reporter=unknown'],
		]) {
			assert.throws(() => parseReportTargets(args), /reporter/i);
		}
	});

	it('Normalizes the single-reporter API shorthand and copies explicit destinations', () => {
		assert.deepEqual(resolveReportTargets({ reporter: 'json' }), [{ reporter: 'json' }]);
		assert.deepEqual(resolveReportTargets({ reporterFile: 'report.txt' }), [
			{ reporter: 'default', reporterFile: 'report.txt' },
		]);
		const reporters: ReportTarget[] = [
			{ reporter: 'default' },
			{ reporter: 'sarif', reporterFile: 'report.sarif' },
		];
		const resolved = resolveReportTargets({ reporters });
		assert.deepEqual(resolved, reporters);
		assert.notEqual(resolved, reporters);
		assert.notEqual(resolved[0], reporters[0]);
	});

	it('Rejects ambiguous API options and an empty reporter list', () => {
		assert.throws(() => resolveReportTargets({ reporters: [] }), /reporter/i);
		assert.throws(
			() => resolveReportTargets({ reporters: [{ reporter: 'json' }], reporter: 'default' }),
			/reporters.*reporter\/reporterFile/,
		);
		assert.throws(
			() => resolveReportTargets({ reporters: [{ reporter: 'json' }], reporterFile: 'report.txt' }),
			/reporters.*reporter\/reporterFile/,
		);
		assert.throws(
			() => resolveReportTargets({ reporters: [{ reporter: 'unknown' as 'json' }] }),
			/Unknown reporter/,
		);
		assert.throws(() => resolveReportTargets({ reporterFile: '' }), /non-empty/);
	});
});
