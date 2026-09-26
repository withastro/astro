import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getNonHydratedComponentPaths } from '../../../dist/core/compile/component-metadata.js';

describe('getNonHydratedComponentPaths', () => {
	it('returns components rendered without a client directive', () => {
		const source = `---
import Card from '../components/Card.jsx';
---
<Card />
<Card client:load />`;

		assert.deepEqual(
			getNonHydratedComponentPaths(source, (specifier) => specifier),
			['../components/Card.jsx'],
		);
	});

	it('excludes components whose renderings are all hydrated', () => {
		const source = `---
import Card from '../components/Card.jsx';
---
<Card client:load />
<Card client:visible />`;

		assert.deepEqual(
			getNonHydratedComponentPaths(source, (specifier) => specifier),
			[],
		);
	});
});
