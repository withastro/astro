import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React, { useState } from 'react';
import renderer from '../src/server.ts';

// Regression test for https://github.com/withastro/astro/issues/16767
// In React 19 dev mode, check() calls the component inside a Tester wrapper
// during the renderer probe. When the component uses hooks, React emits an
// "Invalid hook call" warning because the hooks run in Tester's render context.
// This test verifies that the warning is suppressed and never reaches console.error.

describe('check() - hook warning suppression', () => {
	it('does not emit "Invalid hook call" to console.error when probing a hook-using component', async () => {
		function ComponentWithHooks() {
			const [count, setCount] = useState(0);
			return React.createElement('div', { onClick: () => setCount(count + 1) }, count);
		}

		const hookWarnings: string[] = [];
		const prevError = console.error;
		console.error = (...args: unknown[]) => {
			if (typeof args[0] === 'string' && args[0].includes('Invalid hook call')) {
				hookWarnings.push(String(args[0]));
			}
		};

		try {
			await renderer.check.call(null as any, ComponentWithHooks, {}, {});
		} finally {
			console.error = prevError;
		}

		assert.equal(
			hookWarnings.length,
			0,
			'check() must not emit "Invalid hook call" warnings when probing hook-using components',
		);
	});
});
