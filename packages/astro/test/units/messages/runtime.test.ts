import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { stripVTControlCharacters } from 'node:util';
import { formatErrorMessage } from '../../../dist/core/messages/runtime.js';

function createError(frames: string[]) {
	const err = new Error('boom');
	err.stack = ['Error: boom', ...frames].join('\n');
	return err;
}

function stackLinesOf(output: string) {
	return stripVTControlCharacters(output)
		.split('\n')
		.filter((line) => line.trimStart().startsWith('at '));
}

describe('formatErrorMessage', () => {
	it('includes every consecutive stack frame in order', () => {
		const frames = ['fourth', 'third', 'second', 'first', 'index'].map(
			(name) => `    at ${name} (/project/src/pages/index.mjs:1:1)`,
		);
		const err = createError(frames);

		assert.deepEqual(stackLinesOf(formatErrorMessage(err, true)), frames);
		assert.deepEqual(stackLinesOf(formatErrorMessage(err, false)), frames);
	});

	it('cuts the stack at the first node_modules frame on repeated calls', () => {
		const err = createError([
			'    at user (/project/src/user.mjs:1:1)',
			'    at other (/project/src/other.mjs:1:1)',
			'    at dep (/project/node_modules/dep/index.js:1:1)',
			'    at dep2 (/project/node_modules/dep/index.js:2:1)',
		]);
		const expected = [
			'    at user (/project/src/user.mjs:1:1)',
			'    at other (/project/src/other.mjs:1:1)',
		];

		assert.deepEqual(stackLinesOf(formatErrorMessage(err, false)), expected);
		assert.deepEqual(stackLinesOf(formatErrorMessage(err, false)), expected);
	});
});
