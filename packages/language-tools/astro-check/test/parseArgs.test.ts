import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseArgsAsCheckConfig } from '../dist/index.js';

describe('astro-check - Arguments parser', async () => {
	it('Can parse an empty array', async () => {
		const result = parseArgsAsCheckConfig([]);

		assert.strictEqual(result.watch, false);
		assert.strictEqual(result.root, process.cwd());
		assert.strictEqual(result.tsconfig, undefined);
		assert.strictEqual(result.minimumFailingSeverity, 'error');
		assert.strictEqual(result.minimumSeverity, 'hint');
		assert.strictEqual(result.preserveWatchOutput, false);
	});

	it('Can parse boolean', async () => {
		const result = parseArgsAsCheckConfig(['', '', '-w', '--preserveWatchOutput']);
		assert.strictEqual(result.watch, true);
		assert.strictEqual(result.preserveWatchOutput, true);
	});

	it('Can parse help aliases', async () => {
		assert.strictEqual(parseArgsAsCheckConfig(['', '', '--help']).help, true);
		assert.strictEqual(parseArgsAsCheckConfig(['', '', '-h']).help, true);
	});

	it('Can parse string', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--root', 'foo']);
		assert.strictEqual(result.root, 'foo');
	});

	it('Can parse string with choice', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--minimumSeverity', 'error']);
		assert.strictEqual(result.minimumSeverity, 'error');
	});

	it('Can parse dashed option names', async () => {
		const result = parseArgsAsCheckConfig([
			'',
			'',
			'--minimum-severity',
			'warning',
			'--preserve-watch-output',
		]);
		assert.strictEqual(result.minimumSeverity, 'warning');
		assert.strictEqual(result.preserveWatchOutput, true);
	});

	it('Rejects values outside severity choices', async () => {
		assert.throws(
			() => parseArgsAsCheckConfig(['', '', '--minimumSeverity', 'fatal']),
			/Expected one of: error, warning, hint/,
		);
	});
});
