import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { stripVTControlCharacters } from 'node:util';
import { formatErrorMessage } from '../../../dist/core/messages/runtime.js';

const SEE_FULL_TRACE = '    [...] See full stack trace in the browser, or rerun with --verbose.';

const frames = [
	'    at render (/app/src/pages/index.astro:3:9)',
	'    at renderPage (/app/src/lib/page.ts:10:5)',
	'    at build (/app/src/lib/build.ts:20:1)',
	'    at run (/app/node_modules/astro/dist/core/build/index.js:1:1)',
];

function errorWithStack(message: string, stackFrames: string[]): Error {
	const err = new Error(message);
	err.stack = [`Error: ${message}`, ...stackFrames].join('\n');
	return err;
}

function format(err: Error, showFullStacktrace: boolean): string {
	return stripVTControlCharacters(formatErrorMessage(err, showFullStacktrace));
}

describe('formatErrorMessage', () => {
	it('prints every frame of the stack trace when the full trace is requested', () => {
		assert.equal(
			format(errorWithStack('boom', frames), true),
			['boom', '  Stack trace:', ...frames].join('\n'),
		);
	});

	it('prints every frame before the first one in a dependency', () => {
		assert.equal(
			format(errorWithStack('boom', frames), false),
			['boom', '  Stack trace:', ...frames.slice(0, 3), SEE_FULL_TRACE].join('\n'),
		);
	});

	it('reads the cause stack on its own after the error stack', () => {
		const causeFrames = [
			'    at load (/app/node_modules/some-dep/index.js:1:1)',
			'    at main (/app/src/main.ts:2:2)',
			'    at run (/app/node_modules/astro/dist/core/build/index.js:1:1)',
		];
		const err = errorWithStack('outer', frames);
		err.cause = errorWithStack('inner', causeFrames);

		// The cause fails inside a dependency, so its whole stack is printed.
		assert.equal(
			format(err, false),
			[
				'outer',
				'  Stack trace:',
				...frames.slice(0, 3),
				SEE_FULL_TRACE,
				'  Caused by:',
				'  inner',
				...causeFrames,
			].join('\n'),
		);
	});
});
