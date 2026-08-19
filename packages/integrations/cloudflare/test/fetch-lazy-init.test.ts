import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

/**
 * `@astrojs/cloudflare/fetch` must not call `createApp()` or `setGetEnv()`
 * at module top-level. Eager calls cause a circular-dependency crash when
 * a user's custom `fetchFile` (`src/worker.ts`) statically imports `cf`
 * from `@astrojs/cloudflare/fetch`.
 *
 * The cycle: fetch.ts → astro/app/entrypoint → virtual:astro:fetchable
 *          → user worker → fetch.ts
 *
 * See: https://github.com/withastro/astro/issues/16956
 */
describe('@astrojs/cloudflare/fetch lazy initialization', () => {
	const source = readFileSync(new URL('../dist/fetch.js', import.meta.url), 'utf-8');

	it('does not call createApp() at module top-level', () => {
		// After the fix, createApp() should only appear inside the
		// ensureInitialized() function body, not as a bare top-level statement.
		// We check that there is no top-level `createApp()` by verifying the
		// pattern does NOT appear outside a function body.
		// A simple heuristic: the call `= createApp()` should not exist as a
		// top-level const/let/var assignment (the old pattern was `const app = createApp()`).
		const topLevelCreateApp = /^(?:const|let|var)\s+\w+\s*=\s*createApp\(\)/m;
		assert.equal(
			topLevelCreateApp.test(source),
			false,
			'createApp() must not be called at module top-level (causes circular import crash)',
		);
	});

	it('does not call setGetEnv() at module top-level', () => {
		// The old pattern was a bare `setGetEnv(createGetEnv(globalEnv))` statement
		// at the top level. After the fix this should only appear inside ensureInitialized().
		// A line starting with `setGetEnv(` (not inside a function) is the problem pattern.
		const lines = source.split('\n');
		const topLevelSetGetEnv = lines.some((line) => {
			const trimmed = line.trim();
			// Skip lines inside function bodies (indented or after opening brace)
			// A simple heuristic: if the line starts with setGetEnv and is not indented,
			// it's top-level.
			return trimmed.startsWith('setGetEnv(') && !line.startsWith('  ') && !line.startsWith('\t');
		});
		assert.equal(
			topLevelSetGetEnv,
			false,
			'setGetEnv() must not be called at module top-level (causes circular import crash)',
		);
	});

	it('exports ensureInitialized or calls it inside cf()', () => {
		// Verify that lazy init is wired into the cf() function
		assert.ok(
			source.includes('ensureInitialized()'),
			'cf() should call ensureInitialized() for lazy setup',
		);
	});

	it('exports a cf function', () => {
		// Sanity check: the module still exports cf
		assert.ok(
			source.includes('export {') && source.includes('cf'),
			'Module should export the cf function',
		);
	});
});
