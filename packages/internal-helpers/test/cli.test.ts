import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertValidPackageName } from '../src/cli.ts';

describe('assertValidPackageName', () => {
	it('accepts package names with safe tags and versions', () => {
		assert.doesNotThrow(() => assertValidPackageName('react@latest'));
		assert.doesNotThrow(() => assertValidPackageName('@astrojs/react@latest'));
		assert.doesNotThrow(() => assertValidPackageName('@astrojs/react@5.0.0-beta.1'));
	});

	it('rejects unsafe or malformed package specifiers', () => {
		assert.throws(() => assertValidPackageName('react;whoami@latest'));
		assert.throws(() => assertValidPackageName('react@latest;whoami'));
		assert.throws(() => assertValidPackageName('react@$(whoami)'));
		assert.throws(() => assertValidPackageName('react@latest@next'));
		assert.throws(() => assertValidPackageName('@astrojs/react@'));
	});
});
