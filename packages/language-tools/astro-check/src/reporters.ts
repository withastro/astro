import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { type CheckResult, type Diagnostic, DiagnosticSeverity } from '@astrojs/language-server';

export const reporterNames = ['default', 'json', 'sarif', 'junit', 'checkstyle'] as const;
export type Reporter = (typeof reporterNames)[number];

type Severity = 'error' | 'warning' | 'hint';

export function filterDiagnostics(diagnostics: Diagnostic[], minimumSeverity: Severity) {
	const severity = {
		error: DiagnosticSeverity.Error,
		warning: DiagnosticSeverity.Warning,
		hint: DiagnosticSeverity.Hint,
	}[minimumSeverity];
	return diagnostics.filter(
		(diagnostic) => (diagnostic.severity ?? DiagnosticSeverity.Error) <= severity,
	);
}

export function formatReport(
	result: CheckResult,
	config: {
		reporter: Reporter;
		root: string;
		summary: string;
		minimumSeverity: Severity;
		minimumFailingSeverity: Severity;
	},
): string {
	if (config.reporter === 'default') {
		return `${stripVTControlCharacters(
			[...result.fileResult.map((file) => file.text).filter(Boolean), config.summary].join('\n'),
		)}\n`;
	}

	const diagnostics = result.fileResult.flatMap((file) =>
		filterDiagnostics(file.errors, config.minimumSeverity).map((diagnostic) => ({
			uri: file.fileUrl.href,
			file: path.relative(config.root, fileURLToPath(file.fileUrl)).split(path.sep).join('/'),
			severity:
				diagnostic.severity === DiagnosticSeverity.Warning
					? 'warning'
					: diagnostic.severity === DiagnosticSeverity.Information
						? 'information'
						: diagnostic.severity === DiagnosticSeverity.Hint
							? 'hint'
							: 'error',
			code: diagnostic.code,
			source: diagnostic.source,
			message: stripVTControlCharacters(
				typeof diagnostic.message === 'string' ? diagnostic.message : diagnostic.message.value,
			),
			range: {
				start: {
					line: diagnostic.range.start.line + 1,
					column: diagnostic.range.start.character + 1,
				},
				end: { line: diagnostic.range.end.line + 1, column: diagnostic.range.end.character + 1 },
			},
		})),
	);
	const summary = { errors: result.errors, warnings: result.warnings, hints: result.hints };

	switch (config.reporter) {
		case 'json':
			return `${JSON.stringify(
				{
					version: 1,
					filesChecked: result.fileChecked,
					summary,
					diagnostics: diagnostics.map(({ uri, ...diagnostic }) => diagnostic),
				},
				null,
				2,
			)}\n`;
		case 'sarif': {
			const rules = new Set<string>();
			const results = diagnostics.map((diagnostic) => {
				const ruleId =
					diagnostic.code === undefined
						? undefined
						: [diagnostic.source, diagnostic.code]
								.filter((part) => part !== undefined)
								.map((part) =>
									encodeURIComponent(String(part).replace(/[\ud800-\udfff]/gu, '\ufffd')),
								)
								.join('/') || undefined;
				if (ruleId !== undefined) rules.add(ruleId);
				return {
					ruleId,
					level:
						diagnostic.severity === 'error' || diagnostic.severity === 'warning'
							? diagnostic.severity
							: 'note',
					message: {
						text: (diagnostic.message || 'Diagnostic reported without a message.')
							.replaceAll('{', '{{')
							.replaceAll('}', '}}'),
					},
					locations: [
						{
							physicalLocation: {
								artifactLocation: { uri: diagnostic.uri },
								region: {
									startLine: diagnostic.range.start.line,
									startColumn: diagnostic.range.start.column,
									endLine: diagnostic.range.end.line,
									endColumn: diagnostic.range.end.column,
								},
							},
						},
					],
				};
			});
			return `${JSON.stringify(
				{
					$schema:
						'https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json',
					version: '2.1.0',
					runs: [
						{
							tool: { driver: { name: '@astrojs/check', rules: [...rules].map((id) => ({ id })) } },
							columnKind: 'utf16CodeUnits',
							results,
						},
					],
				},
				null,
				2,
			)}\n`;
		}
		case 'junit': {
			const failed =
				result.errors > 0 ||
				(config.minimumFailingSeverity !== 'error' && result.warnings > 0) ||
				(config.minimumFailingSeverity === 'hint' && result.hints > 0);
			const counts = `tests="1" failures="${failed ? 1 : 0}" errors="0"`;
			const text = [
				...diagnostics.map(
					(diagnostic) =>
						`${diagnostic.file}:${diagnostic.range.start.line}:${diagnostic.range.start.column} - ${diagnostic.severity} (${diagnosticSource(diagnostic)}): ${diagnostic.message}`,
				),
				stripVTControlCharacters(config.summary),
			].join('\n');
			const output = failed
				? `<failure message="Astro diagnostics exceed the failure threshold.">${escapeXml(text)}</failure>`
				: `<system-out>${escapeXml(text)}</system-out>`;
			return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites ${counts}><testsuite name="astro check" ${counts}><testcase name="astro check">${output}</testcase></testsuite></testsuites>\n`;
		}
		case 'checkstyle': {
			const files = new Map<string, string[]>();
			for (const diagnostic of diagnostics) {
				const errors = files.get(diagnostic.file) ?? [];
				const severity =
					diagnostic.severity === 'error' || diagnostic.severity === 'warning'
						? diagnostic.severity
						: 'info';
				errors.push(
					`<error line="${diagnostic.range.start.line}" column="${diagnostic.range.start.column}" severity="${severity}" message="${escapeXml(diagnostic.message)}" source="${escapeXml(diagnosticSource(diagnostic))}" />`,
				);
				files.set(diagnostic.file, errors);
			}
			return `<?xml version="1.0" encoding="UTF-8"?>\n<checkstyle version="4.3">${[...files]
				.map(([file, errors]) => `<file name="${escapeXml(file)}">${errors.join('')}</file>`)
				.join('')}</checkstyle>\n`;
		}
	}
}

function diagnosticSource(diagnostic: { source?: string; code?: string | number }): string {
	if (diagnostic.code === undefined) return diagnostic.source ?? '@astrojs/check';
	return diagnostic.source === undefined
		? String(diagnostic.code)
		: `${diagnostic.source}/${diagnostic.code}`;
}

function escapeXml(value: string): string {
	return value
		.replace(/[^\t\n\r\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;')
		.replaceAll('\t', '&#9;')
		.replaceAll('\n', '&#10;')
		.replaceAll('\r', '&#13;');
}
