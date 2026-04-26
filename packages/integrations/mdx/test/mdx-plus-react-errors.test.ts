import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

function hookError() {
	const error = console.error;
	const errors: unknown[][] = [];
	console.error = function (...args: unknown[]) {
		errors.push(args);
	};
	return (): unknown[][] => {
		console.error = error;
		return errors;
	};
}

describe('MDX and React with build errors', () => {
	let unhook: (() => unknown[][]) | undefined;

	it('shows correct error messages on build error', async () => {
		try {
			const fixture = await loadFixture({
				root: new URL('./fixtures/mdx-plus-react-errors/', import.meta.url),
			});
			unhook = hookError();
			await fixture.build();
		} catch (err) {
			assert.equal((err as Error).message, 'a is not defined');
		}
		unhook?.();
	});
});
