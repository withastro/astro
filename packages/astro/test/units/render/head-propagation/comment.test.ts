import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasHeadInjectComment } from '../../../../dist/core/head-propagation/comment.js';

describe('head propagation comment detection', () => {
	it('detects // astro-head-inject at start of source', () => {
		assert.equal(hasHeadInjectComment('// astro-head-inject\nexport default 1;'), true);
	});

	it('detects //! astro-head-inject anywhere in source', () => {
		assert.equal(hasHeadInjectComment('const a = 1;\n//! astro-head-inject'), true);
	});

	it('documents current partial-match behavior', () => {
		assert.equal(hasHeadInjectComment('// astro-head-inject-extra'), true);
	});

	it('does not match unrelated comments', () => {
		assert.equal(hasHeadInjectComment('// something else'), false);
	});

	it('documents current non-multiline behavior for // marker', () => {
		const source = 'const x = 1;\n// astro-head-inject';
		assert.equal(hasHeadInjectComment(source), false);
	});
});
