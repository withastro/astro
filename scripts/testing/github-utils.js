// @ts-check
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setSummary } from '../../.github/scripts/utils.mjs';

const reportingConfig = {
	/** The threshold in milliseconds for considering a test as slow. */
	slowTestThreshold: 2000,
	/**
	 * The names of tests that are known to be slow. No warnings will be reported for these tests.
	 * @type {string[]}
	 */
	knownSlowTests: [],
};

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
	 * @param {string} log Raw log file contents
	 * @returns An array of log entries
	 */
	const parseLog = (log) =>
		/** @type {LogEntry[]} */ (
			log
				.split('\n')
				.filter(Boolean)
				.map((l) => JSON.parse(l))
		);

	/**
	 * Generates a Markdown summary of the test run from the log file.
	 * @param {LogEntry[]} lines
	 * @returns {string}
	 */
	const createSummary = (lines) => {
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

		let summary = '';
		const urlBase = 'https://github.com/withastro/astro/blob/main/';

		const slowestBuilds = Object.values(builds)
			.sort((a, b) => b.totalDuration - a.totalDuration)
			.slice(0, 10);

		summary += '## Slowest fixture builds this run\n\n';
		if (slowestBuilds.length === 0) {
			summary +=
				'No builds detected! If you are seeing this message, it likely means there is an issue with the logging implementation. Please investigate. 🐛\n';
			return summary;
		} else {
			summary += '| Fixture | Builds | Total Duration (s) |\n';
			summary += '|---------|-------:|-------------------:|\n';
			for (const entry of slowestBuilds) {
				const url = `${urlBase}${encodeURI(entry.fixture.replaceAll('\\', '/'))}`;
				summary += `| [\`${path.basename(entry.fixture)}\`](${url}) | ${entry.count} | ${(entry.totalDuration / 1000).toFixed(2)} |\n`;
			}
		}

		const slowestTests = lines
			.filter(
				/** @returns {line is TestLogEntry} */
				(line) =>
					line.type === 'test' &&
					!line.isSuite &&
					line.duration >= reportingConfig.slowTestThreshold &&
					!reportingConfig.knownSlowTests.includes(line.name),
			)
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 20);

		summary += '\n## Slowest tests this run\n\n';
		if (slowestTests.length === 0) {
			summary += 'No slow tests detected! Great job! 🎉\n';
			return summary;
		} else {
			summary += '| Test | Duration (s) | Location |\n';
			summary += '|------|-------------:|----------|\n';

			for (const test of slowestTests) {
				const seconds = (test.duration / 1000).toFixed(2);
				if (!test.file) {
					summary += `| ${test.name} | ${seconds} | Unknown |\n`;
				} else {
					const location = `${path.basename(test.file)}:${test.line ?? '?'}:${test.column ?? '?'}`;
					const url = `${urlBase}${encodeURI(test.file.replace(repoRoot, '').replaceAll('\\', '/'))}#L${test.line ?? '?'}`;
					summary += `| ${test.name} | ${seconds} | [\`${location}\`](${url}) |\n`;
				}
			}
		}

		summary += '\n\n' + testDurationHistogram(lines);

		return summary;
	};

	// When the process exits, read the logs and create the step summary.
	process.addListener('exit', () => {
		logStream.end();
		const logContents = fs.readFileSync(logFile, 'utf-8');
		const summary = createSummary(parseLog(logContents));
		setSummary(summary);
	});
}

/**
 * Generate a histogram of test durations from the log entries, and render it as a bar chart in the CI summary. This can help visualize the distribution of test durations and identify any outliers.
 * @param {LogEntry[]} logEntries
 */
function testDurationHistogram(logEntries) {
	const testEntries = logEntries
		// Filter to get only test entries that are not suites
		.filter((entry) => entry.type === 'test' && !entry.isSuite)
		// Sort by duration ascending
		.sort((a, b) => a.duration - b.duration);

	let histogram = '## Test Duration Distribution\n\n';

	if (testEntries.length === 0) {
		histogram += 'No test entries found.\n';
		return histogram;
	}

	const p99Duration = testEntries[Math.floor(testEntries.length * 0.99)].duration;
	const bucketSize = 250; // 250ms buckets
	const bucketCount = Math.ceil(p99Duration / bucketSize);
	const buckets = new Array(bucketCount).fill(0);

	// Count tests in each bucket
	for (const test of testEntries) {
		const bucketIndex = Math.min(Math.floor(test.duration / bucketSize), bucketCount - 1);
		buckets[bucketIndex]++;
	}

	const biggestBucket = Math.max(...buckets);
	const chartWidth = 40; // Max width of the bar in characters

	// Render the histogram using block characters
	histogram += '| Duration Range | Count |\n';
	histogram += '|----------------|-------|\n';
	for (let i = 0; i < buckets.length; i++) {
		const rangeStart = i * bucketSize;
		const rangeEnd = (i + 1) * bucketSize;
		const durationLabel =
			i === buckets.length - 1 ? `> ${rangeStart}ms` : `${rangeStart}ms - ${rangeEnd}ms`;
		const count = buckets[i];
		const barLength = biggestBucket > 0 ? Math.round((count / biggestBucket) * chartWidth) : 0;
		const bar = '█'.repeat(barLength);
		histogram += `| ${durationLabel} | ${bar} ${count} |\n`;
	}

	return histogram;
}
