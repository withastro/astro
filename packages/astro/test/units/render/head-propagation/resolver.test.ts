import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getPropagationHint,
	isPropagatingHint,
	resolvePropagationHint,
} from '../../../../dist/core/head-propagation/resolver.js';

describe('head propagation resolver', () => {
	it('defaults to none', () => {
		const hint = resolvePropagationHint({
			factoryHint: undefined,
			moduleId: undefined,
			metadataLookup: () => undefined,
		});
		assert.equal(hint, 'none');
	});

	it('prefers factory hint over metadata', () => {
		const hint = resolvePropagationHint({
			factoryHint: 'self',
			moduleId: '/src/Comp.astro',
			metadataLookup: () => 'in-tree',
		});
		assert.equal(hint, 'self');
	});

	it('uses metadata fallback when factory hint is none', () => {
		const hint = resolvePropagationHint({
			factoryHint: 'none',
			moduleId: '/src/Comp.astro',
			metadataLookup: () => 'in-tree',
		});
		assert.equal(hint, 'in-tree');
	});

	it('getPropagationHint reads from SSR result metadata', () => {
		const result: any = {
			componentMetadata: new Map([['/src/Comp.astro', { propagation: 'in-tree' }]]),
		};
		const hint = getPropagationHint(result, {
			moduleId: '/src/Comp.astro',
			propagation: 'none',
		});
		assert.equal(hint, 'in-tree');
	});

	it('treats self and in-tree as propagating', () => {
		assert.equal(isPropagatingHint('none'), false);
		assert.equal(isPropagatingHint('self'), true);
		assert.equal(isPropagatingHint('in-tree'), true);
	});
});
