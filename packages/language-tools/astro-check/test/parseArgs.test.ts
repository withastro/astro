import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseArgsAsCheckConfig } from '../dist/index.js';

/** Build a `process.argv`, whose two first entries are the node binary and the script path. */
const argv = (...args: string[]) => ['node', 'astro-check', ...args];

describe('astro-check - Arguments parser', async () => {
	it('Can parse an empty array', async () => {
		const result = parseArgsAsCheckConfig([]);

		assert.strictEqual(result.watch, false);
		assert.strictEqual(result.tsconfig, undefined);
		assert.strictEqual(result.minimumSeverity, 'hint');
		assert.strictEqual(result.preserveWatchOutput, false);
	});

	it('Can parse boolean', async () => {
		const result = parseArgsAsCheckConfig(argv('--watch', '--preserveWatchOutput'));
		assert.strictEqual(result.watch, true);
		assert.strictEqual(result.preserveWatchOutput, true);
	});

	it('Can parse string', async () => {
		const result = parseArgsAsCheckConfig(argv('--root', 'foo'));
		assert.strictEqual(result.root, 'foo');
	});

	it('Can parse string with choice', async () => {
		const result = parseArgsAsCheckConfig(argv('--minimumSeverity', 'error'));
		assert.strictEqual(result.minimumSeverity, 'error');
	});

	it('Only skips the node binary and the script path', async () => {
		const result = parseArgsAsCheckConfig(
			argv('--watch', '--root', 'foo', '--minimumFailingSeverity', 'hint'),
		);

		assert.strictEqual(result.watch, true);
		assert.strictEqual(result.root, 'foo');
		assert.strictEqual(result.minimumFailingSeverity, 'hint');
		assert.deepStrictEqual(result._, []);
	});
});
