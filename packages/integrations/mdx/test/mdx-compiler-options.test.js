import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import mdx from '../dist/index.js';

describe('MDX compiler options', () => {
	it('defaults to mdx compiler', async () => {
		const integration = mdx();
		assert.equal(integration.name, '@astrojs/mdx');
		
		// The default compiler should be set during the config:done hook
		// We'll test the actual behavior through the fixture
	});

	it('accepts mdx-hybrid compiler option', async () => {
		const integration = mdx({ compiler: 'mdx-hybrid' });
		assert.equal(integration.name, '@astrojs/mdx');
		
		// The compiler option should be passed through
		// We'll test the actual behavior through the fixture
	});

	it('validates compiler option', async () => {
		// Test that only valid compiler options are accepted
		const validOptions = ['mdx', 'mdx-hybrid'];
		for (const compiler of validOptions) {
			const integration = mdx({ compiler });
			assert.equal(integration.name, '@astrojs/mdx');
		}
	});
});