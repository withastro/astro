// @ts-check
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Sets the summary for the current step in CI.
 * Based on https://github.com/actions/toolkit/blob/main/packages/core/src/summary.ts
 * @param {string} text
 */
function setSummary(text) {
	const filePath = process.env['GITHUB_STEP_SUMMARY'] || '';
	if (filePath) {
		return fs.writeFileSync(filePath, text);
	}
	process.stdout.write(os.EOL);
}

/**
 * @typedef {{ type: 'build', fixture: string; duration: number }} BuildLogEntry
 * @typedef {{ type: 'test', name: string; duration: number; file: string | undefined; line: number | undefined; column: number | undefined; isSuite: boolean }} TestLogEntry
 * @typedef {BuildLogEntry | TestLogEntry} LogEntry
 */

/**
 * The methods here log data to a local log file that is used for generating a summary of activity
 * in CI. When not in CI, these methods are no-ops.
 */
export const CILogger = {
	/**
	 * @param {Omit<BuildLogEntry, 'type'>} _logEntry Lines to append to the test log file.
	 */
	logBuild: (_logEntry) => {}, // noop when not in CI
	/**
	 * @param {Omit<TestLogEntry, 'type'>} _logEntry Lines to append to the test log file.
	 */
	logTest: (_logEntry) => {}, // noop when not in CI
};

if (process.env.CI) {
	const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
	const cacheDir = path.join(repoRoot, 'node_modules/.cache/astro-test-utils');
	const logFile = path.join(cacheDir, 'log.txt');
	// Create cache directory and log file if they don't exist
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir, { recursive: true });
	}
	if (!fs.existsSync(logFile)) {
		fs.writeFileSync(logFile, '');
	}

	const logStream = fs.createWriteStream(logFile, { flags: 'a' });

	CILogger.logBuild = (logEntry) => {
		logStream.write(JSON.stringify({ type: 'build', ...logEntry }) + '\n');
	};
	CILogger.logTest = (logEntry) => {
		logStream.write(JSON.stringify({ type: 'test', ...logEntry }) + '\n');
	};

	/**
	 * Generates a Markdown summary of the test run from the log file.
	 * @param {string} logs
	 * @returns {string}
	 */
	const createSummary = (logs) => {
		const lines = /** @type {LogEntry[]} */ (
			logs
				.split('\n')
				.filter(Boolean)
				.map((l) => JSON.parse(l))
		);
		if (lines.length === 0) {
			return 'No test logs found.';
		}

		/** @type {Record<string, { fixture: string; count: number; totalDuration: number }>} */
		const builds = {};
		for (const line of lines) {
			if (line.type !== 'build') continue;
			builds[line.fixture] ??= {
				fixture: line.fixture.replace(repoRoot, ''),
				count: 0,
				totalDuration: 0,
			};
			builds[line.fixture].count++;
			builds[line.fixture].totalDuration += line.duration;
		}

		let summary = '## Slowest fixture builds this run\n\n';
		summary += '| Fixture | Builds | Total Duration (s) |\n';
		summary += '|---------|-------:|-------------------:|\n';

		const urlBase = 'https://github.com/withastro/astro/blob/main/';

		const slowestBuilds = Object.values(builds)
			.sort((a, b) => b.totalDuration - a.totalDuration)
			.slice(0, 10);
		for (const entry of slowestBuilds) {
			const url = `${urlBase}${encodeURI(entry.fixture.replaceAll('\\', '/'))}`;
			summary += `| [\`${path.basename(entry.fixture)}\`](${url}) | ${entry.count} | ${(entry.totalDuration / 1000).toFixed(2)} |\n`;
		}

		summary += '\n## Slowest tests this run\n\n';
		summary += '| Test | Duration (s) | Location |\n';
		summary += '|------|-------------:|----------|\n';

		const slowestTests = lines
			.filter(
				/** @returns {line is TestLogEntry} */
				(line) => line.type === 'test' && !line.isSuite,
			)
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 20);
		for (const test of slowestTests) {
			const location = test.file
				? `${path.basename(test.file)}:${test.line ?? '?'}:${test.column ?? '?'}`
				: 'Unknown';
			const url = test.file
				? `${urlBase}${encodeURI(test.file.replace(repoRoot, '').replaceAll('\\', '/'))}#L${test.line ?? '?'}`
				: '';
			summary += `| ${test.name} | ${(test.duration / 1000).toFixed(2)} | [\`${location}\`](${url}) |\n`;
		}

		return summary;
	};

	// Close stream before process exits.
	process.addListener('exit', () => {
		logStream.end();
		const logContents = fs.readFileSync(logFile, 'utf-8');
		const summary = createSummary(logContents);
		setSummary(summary);
	});
}
