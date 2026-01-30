import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseArgsAsCheckConfig } from '../dist/index.js';

describe('astro-check - Arguments parser', async () => {
	it('Can parse an empty array', async () => {
		const result = parseArgsAsCheckConfig([]);

		assert.strictEqual(result.watch, false);
		assert.strictEqual(result.tsconfig, undefined);
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

	it('Can parse string with choice', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--minimumSeverity', 'error']);
		assert.strictEqual(result.minimumSeverity, 'error');
	});
});
