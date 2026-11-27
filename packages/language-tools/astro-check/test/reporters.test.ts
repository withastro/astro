import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import type { CheckResult } from '@astrojs/language-server';
import { EntityDecoder, XML } from '@nodable/entities';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { formatReport } from '../dist/reporters.js';

const root = path.resolve('report-fixture');
const file = 'src/café #100% & notes.astro';
const fileUrl = pathToFileURL(path.join(root, file));
const message = 'Cannot <resolve> "café" & \'🚀\'\nnext\r\tline';
const range = { start: { line: 0, character: 2 }, end: { line: 1, character: 3 } };
const diagnostics: CheckResult['fileResult'][number]['errors'] = [
	{ message, range, severity: 1, code: 2304, source: 'ts' },
	{ message: 'warning only', range, severity: 2, code: 'warn&code', source: 'astro' },
	{ message: 'information only', range, severity: 3 },
	{ message: 'hint only', range, severity: 4, code: 0 },
	{ message: 'implicit error', range },
];
const result: CheckResult = {
	status: 'completed',
	fileChecked: 7,
	errors: 2,
	warnings: 1,
	hints: 1,
	fileResult: [{ errors: diagnostics, fileUrl, fileContent: '🚀broken\r\nnext', text: '' }],
};
const config = {
	root,
	summary: 'Result (7 files):\n- 2 errors\n- 1 warning\n- 1 hint\n',
	minimumSeverity: 'hint' as const,
	minimumFailingSeverity: 'error' as const,
};

function parseXml(report: string) {
	assert.equal(XMLValidator.validate(report), true);
	return new XMLParser({
		ignoreAttributes: false,
		entityDecoder: new EntityDecoder({ namedEntities: XML, numericAllowed: true }),
		parseTagValue: false,
		trimValues: false,
	}).parse(report);
}

describe('astro-check - report formats', () => {
	it('Serializes JSON diagnostics with original codes and one-based UTF-16 ranges', () => {
		const report = JSON.parse(formatReport(result, { ...config, reporter: 'json' }));
		assert.equal(report.version, 1);
		assert.equal(report.filesChecked, 7);
		assert.deepEqual(report.summary, { errors: 2, warnings: 1, hints: 1 });
		assert.deepEqual(report.diagnostics[0], {
			file,
			severity: 'error',
			code: 2304,
			source: 'ts',
			message,
			range: { start: { line: 1, column: 3 }, end: { line: 2, column: 4 } },
		});
		assert.deepEqual(
			report.diagnostics.map((diagnostic: { severity: string }) => diagnostic.severity),
			['error', 'warning', 'information', 'hint', 'error'],
		);
		assert.equal(report.diagnostics[1].code, 'warn&code');
		assert.equal(report.diagnostics[3].code, 0);
		assert.ok(!('code' in report.diagnostics[2]));
		assert.ok(!('source' in report.diagnostics[2]));
	});

	it('Filters raw diagnostics without changing the original summary counts', () => {
		for (const [minimumSeverity, count] of [
			['error', 2],
			['warning', 3],
			['hint', 5],
		] as const) {
			const report = JSON.parse(
				formatReport(result, { ...config, reporter: 'json', minimumSeverity }),
			);
			assert.equal(report.diagnostics.length, count);
			assert.deepEqual(report.summary, { errors: 2, warnings: 1, hints: 1 });
		}
	});

	it('Preserves markup message text while stripping ANSI control sequences', () => {
		const markupResult: CheckResult = {
			...result,
			fileResult: [
				{
					...result.fileResult[0],
					errors: [
						{
							...diagnostics[0],
							message: { kind: 'markdown', value: '\u001b[31m**Use** `title`\u001b[0m' },
						},
					],
				},
			],
		};
		const json = JSON.parse(formatReport(markupResult, { ...config, reporter: 'json' }));
		const sarif = JSON.parse(formatReport(markupResult, { ...config, reporter: 'sarif' }));
		assert.equal(json.diagnostics[0].message, '**Use** `title`');
		assert.equal(sarif.runs[0].results[0].message.text, '**Use** `title`');
	});

	it('Emits SARIF locations with encoded absolute URIs, UTF-16 columns and severity levels', () => {
		const report = JSON.parse(formatReport(result, { ...config, reporter: 'sarif' }));
		assert.equal(report.version, '2.1.0');
		assert.equal(report.runs.length, 1);
		const run = report.runs[0];
		assert.ok(run.tool.driver.name);
		assert.equal(run.columnKind, 'utf16CodeUnits');
		assert.deepEqual(
			run.results.map((diagnostic: { level: string }) => diagnostic.level),
			['error', 'warning', 'note', 'note', 'error'],
		);
		const location = run.results[0].locations[0].physicalLocation;
		assert.equal(location.artifactLocation.uri, fileUrl.href);
		assert.deepEqual(location.region, {
			startLine: 1,
			startColumn: 3,
			endLine: 2,
			endColumn: 4,
		});
		assert.equal(run.results[0].message.text, message);
		assert.equal(run.results[0].ruleId, 'ts/2304');
		assert.equal(run.results[3].ruleId, '0');
		assert.ok(!('ruleId' in run.results[2]));
	});

	it('Escapes literal braces only in SARIF messages and handles empty messages and codes', () => {
		const literalMessage = 'Expected { foo: string }, received "{0}"';
		const literalResult = {
			...result,
			fileResult: [
				{
					...result.fileResult[0],
					errors: [
						{ message: literalMessage, range },
						{ message: '', code: '', range },
					],
				},
			],
		};
		const json = JSON.parse(formatReport(literalResult, { ...config, reporter: 'json' }));
		assert.equal(json.diagnostics[0].message, literalMessage);
		assert.equal(json.diagnostics[1].message, '');
		assert.equal(json.diagnostics[1].code, '');
		const sarif = JSON.parse(formatReport(literalResult, { ...config, reporter: 'sarif' }));
		assert.equal(
			sarif.runs[0].results[0].message.text,
			'Expected {{ foo: string }}, received "{{0}}"',
		);
		assert.equal(sarif.runs[0].results[1].message.text, 'Diagnostic reported without a message.');
		assert.ok(!('ruleId' in sarif.runs[0].results[1]));
	});

	it('Preserves zero-width diagnostic ranges', () => {
		const point = { line: 0, character: 0 };
		const pointResult = {
			...result,
			fileResult: [
				{
					...result.fileResult[0],
					errors: [{ message: 'insertion', range: { start: point, end: point } }],
				},
			],
		};
		const json = JSON.parse(formatReport(pointResult, { ...config, reporter: 'json' }));
		assert.deepEqual(json.diagnostics[0].range, {
			start: { line: 1, column: 1 },
			end: { line: 1, column: 1 },
		});
		const sarif = JSON.parse(formatReport(pointResult, { ...config, reporter: 'sarif' }));
		assert.deepEqual(sarif.runs[0].results[0].locations[0].physicalLocation.region, {
			startLine: 1,
			startColumn: 1,
			endLine: 1,
			endColumn: 1,
		});
	});

	it('Round-trips Checkstyle message attributes and maps severities and positions', () => {
		const report = parseXml(formatReport(result, { ...config, reporter: 'checkstyle' }));
		assert.equal(report.checkstyle.file['@_name'], file);
		const errors = report.checkstyle.file.error;
		assert.equal(errors[0]['@_line'], '1');
		assert.equal(errors[0]['@_column'], '3');
		assert.equal(errors[0]['@_message'], message);
		assert.ok(errors[0]['@_source'].includes('ts'));
		assert.ok(errors[0]['@_source'].includes('2304'));
		assert.deepEqual(
			errors.map((error: Record<string, string>) => error['@_severity']),
			['error', 'warning', 'info', 'info', 'error'],
		);
	});

	it('Encodes source and code identifiers without corrupting XML or SARIF', () => {
		const identifiersResult = {
			...result,
			fileResult: [
				{
					...result.fileResult[0],
					errors: [{ ...diagnostics[0], source: 'ts "&\n\ud800', code: 'rule/é&\t' }],
				},
			],
		};
		const sarif = JSON.parse(formatReport(identifiersResult, { ...config, reporter: 'sarif' }));
		assert.equal(sarif.runs[0].results[0].ruleId, 'ts%20%22%26%0A%EF%BF%BD/rule%2F%C3%A9%26%09');
		const checkstyle = parseXml(
			formatReport(identifiersResult, { ...config, reporter: 'checkstyle' }),
		);
		assert.equal(checkstyle.checkstyle.file.error['@_source'], 'ts "&\n/rule/é&\t');
		const junit = parseXml(formatReport(identifiersResult, { ...config, reporter: 'junit' }));
		const suite = junit.testsuites?.testsuite ?? junit.testsuite;
		assert.ok(suite.testcase.failure['#text'].includes('ts "&\n/rule/é&\t'));
	});

	it('Uses the full result for JUnit failure status even when failing diagnostics are hidden', () => {
		const warningResult = {
			...result,
			errors: 0,
			hints: 0,
			fileResult: [{ ...result.fileResult[0], errors: [diagnostics[1]] }],
		};
		for (const minimumFailingSeverity of ['error', 'warning', 'hint'] as const) {
			const report = parseXml(
				formatReport(warningResult, {
					...config,
					reporter: 'junit',
					minimumSeverity: 'error',
					minimumFailingSeverity,
					summary: 'Result (7 files):\n- 0 errors',
				}),
			);
			const suite = report.testsuites?.testsuite ?? report.testsuite;
			assert.equal(suite['@_tests'], '1');
			assert.equal(suite['@_errors'], '0');
			assert.equal(suite['@_failures'], minimumFailingSeverity === 'error' ? '0' : '1');
			assert.equal(suite.testcase['@_name'], 'astro check');
			assert.equal('failure' in suite.testcase, minimumFailingSeverity !== 'error');
			assert.ok(!JSON.stringify(suite).includes('warning only'));
		}
	});

	it('Keeps non-failing visible diagnostics in JUnit system-out', () => {
		const hintResult = {
			...result,
			errors: 0,
			warnings: 0,
			fileResult: [{ ...result.fileResult[0], errors: [diagnostics[3]] }],
		};
		const report = parseXml(
			formatReport(hintResult, {
				...config,
				reporter: 'junit',
				summary: 'Result (7 files):\n- 0 errors\n- 0 warnings\n- 1 hint\n',
			}),
		);
		const suite = report.testsuites?.testsuite ?? report.testsuite;
		assert.equal(suite['@_failures'], '0');
		assert.ok(!('failure' in suite.testcase));
		assert.ok(suite.testcase['system-out'].includes('hint only'));
	});

	it('Produces valid XML for messages containing reserved characters and invalid code points', () => {
		const invalidResult = {
			...result,
			fileResult: [
				{
					...result.fileResult[0],
					errors: [
						{ ...diagnostics[0], message: `${message}\u0000\u0001\ud800end\udfff\ufffe\uffff` },
					],
				},
			],
		};
		for (const reporter of ['junit', 'checkstyle'] as const) {
			const output = formatReport(invalidResult, { ...config, reporter });
			const parsed = parseXml(output);
			const invalidCodePoints = [0, 1, 0xd800, 0xdfff, 0xfffe, 0xffff];
			assert.ok(
				Array.from(output).every(
					(character) => !invalidCodePoints.includes(character.codePointAt(0)!),
				),
			);
			assert.ok(JSON.stringify(parsed).includes('🚀'));
			if (reporter === 'checkstyle') {
				assert.equal(parsed.checkstyle.file.error['@_message'], `${message}end`);
			} else {
				const suite = parsed.testsuites?.testsuite ?? parsed.testsuite;
				assert.ok(suite.testcase.failure['#text'].includes('Cannot <resolve> "café" & \'🚀\''));
			}
			assert.ok(output.endsWith('\n'));
		}
	});

	it('Produces a valid empty report for each machine format', () => {
		const cleanResult = { ...result, errors: 0, warnings: 0, hints: 0, fileResult: [] };
		for (const reporter of ['json', 'sarif', 'junit', 'checkstyle'] as const) {
			const output = formatReport(cleanResult, { ...config, reporter });
			assert.ok(output.endsWith('\n'));
			if (reporter === 'json') assert.deepEqual(JSON.parse(output).diagnostics, []);
			else if (reporter === 'sarif') assert.deepEqual(JSON.parse(output).runs[0].results, []);
			else parseXml(output);
		}
	});
});
