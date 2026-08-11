import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatErrorMessage } from '../../../dist/core/messages/runtime.js';
import type { ErrorWithMetadata } from '../../../dist/core/errors/errors.js';

function errorWithStack(frames: string[]): ErrorWithMetadata {
	const err = new Error('boom') as ErrorWithMetadata;
	err.stack = ['Error: boom', ...frames].join('\n');
	return err;
}

describe('formatErrorMessage()', () => {
	it('keeps every stack frame', () => {
		const frames = [
			'    at first (/app/src/pages/index.astro:3:1)',
			'    at second (/app/src/lib/a.ts:10:5)',
			'    at third (/app/src/lib/b.ts:2:2)',
			'    at fourth (/app/src/lib/c.ts:4:4)',
		];
		const output = formatErrorMessage(errorWithStack(frames), true);
		for (const frame of frames) {
			assert.ok(output.includes(frame.trim()), `missing stack frame: ${frame.trim()}`);
		}
	});

	it('formats the same stack the same way every time', () => {
		const err = errorWithStack([
			'    at first (/app/src/pages/index.astro:3:1)',
			'    at second (/app/src/lib/a.ts:10:5)',
			'    at vite (/app/node_modules/vite/dist/node/index.js:1:1)',
		]);
		assert.equal(formatErrorMessage(err, true), formatErrorMessage(err, true));
	});
});
