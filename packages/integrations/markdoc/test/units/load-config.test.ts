import assert from 'node:assert/strict';
import { sep } from 'node:path';
import { describe, it } from 'node:test';
import { loadMarkdocConfig } from '../../dist/load-config.js';

describe('loadMarkdocConfig', () => {
	it('resolves tsconfig path aliases in markdoc config imports', async () => {
		const root = new URL('../fixtures/config-path-alias/', import.meta.url);
		const result = await loadMarkdocConfig({ root });
		assert.deepEqual(result?.config.nodes, { document: { render: null } });
		assert.equal(result?.config.variables?.sep, sep);
	});
});
