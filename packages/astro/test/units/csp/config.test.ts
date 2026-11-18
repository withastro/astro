import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cspHashEntrySchema, cspResourceEntrySchema } from '../../../dist/core/csp/config.js';
import {
	normalizeCspHashEntry,
	normalizeCspResourceEntry,
} from '../../../dist/core/csp/runtime.js';

describe('cspResourceEntrySchema', () => {
	it('accepts a bare string (default kind)', () => {
		assert.equal(cspResourceEntrySchema.safeParse("'self'").success, true);
	});

	it('accepts a host source scoped to element', () => {
		assert.equal(
			cspResourceEntrySchema.safeParse({ resource: 'https://cdn.example.com', kind: 'element' })
				.success,
			true,
		);
	});

	it("rejects 'unsafe-hashes' on element", () => {
		assert.equal(
			cspResourceEntrySchema.safeParse({ resource: "'unsafe-hashes'", kind: 'element' }).success,
			false,
		);
	});

	it('accepts allowed keyword sources on attribute', () => {
		for (const resource of ["'none'", "'unsafe-hashes'", "'unsafe-inline'", "'report-sample'"]) {
			assert.equal(
				cspResourceEntrySchema.safeParse({ resource, kind: 'attribute' }).success,
				true,
				`${resource} should be allowed on attribute`,
			);
		}
	});

	it('rejects host sources on attribute', () => {
		assert.equal(
			cspResourceEntrySchema.safeParse({ resource: 'https://cdn.example.com', kind: 'attribute' })
				.success,
			false,
		);
	});

	it('requires `kind` in the object form', () => {
		assert.equal(
			cspResourceEntrySchema.safeParse({ resource: 'https://cdn.example.com' }).success,
			false,
		);
	});
});

describe('cspHashEntrySchema', () => {
	it('accepts a bare hash and a kind-scoped hash', () => {
		assert.equal(cspHashEntrySchema.safeParse('sha256-abc').success, true);
		assert.equal(
			cspHashEntrySchema.safeParse({ hash: 'sha256-abc', kind: 'element' }).success,
			true,
		);
	});

	it('rejects a malformed hash', () => {
		assert.equal(cspHashEntrySchema.safeParse('not-a-hash').success, false);
	});
});

describe('normalize helpers', () => {
	it('normalizes resource entries', () => {
		assert.deepStrictEqual(normalizeCspResourceEntry("'self'"), {
			resource: "'self'",
			kind: 'default',
		});
		assert.deepStrictEqual(
			normalizeCspResourceEntry({ resource: 'https://cdn', kind: 'element' }),
			{
				resource: 'https://cdn',
				kind: 'element',
			},
		);
		// `kind` is required in the typed object form, but normalize stays defensive for untyped
		// (JS) callers that omit it, falling back to "default".
		assert.deepStrictEqual(normalizeCspResourceEntry({ resource: 'https://cdn' } as any), {
			resource: 'https://cdn',
			kind: 'default',
		});
	});

	it('normalizes hash entries', () => {
		assert.deepStrictEqual(normalizeCspHashEntry('sha256-abc'), {
			hash: 'sha256-abc',
			kind: 'default',
		});
		assert.deepStrictEqual(normalizeCspHashEntry({ hash: 'sha256-abc', kind: 'attribute' }), {
			hash: 'sha256-abc',
			kind: 'attribute',
		});
	});
});
