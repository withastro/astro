import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	shouldRenderHeadInstruction,
	shouldRenderInstruction,
	shouldRenderMaybeHeadInstruction,
} from '../../../../dist/core/head-propagation/policy.js';

describe('head propagation policy', () => {
	it('renders head instruction when head not rendered and not partial', () => {
		assert.equal(
			shouldRenderHeadInstruction({
				hasRenderedHead: false,
				headInTree: true,
				partial: false,
			}),
			true,
		);
	});

	it('does not render head instruction when already rendered or partial', () => {
		assert.equal(
			shouldRenderHeadInstruction({
				hasRenderedHead: true,
				headInTree: false,
				partial: false,
			}),
			false,
		);
		assert.equal(
			shouldRenderHeadInstruction({
				hasRenderedHead: false,
				headInTree: false,
				partial: true,
			}),
			false,
		);
	});

	it('renders maybe-head instruction only when head absent in tree', () => {
		assert.equal(
			shouldRenderMaybeHeadInstruction({
				hasRenderedHead: false,
				headInTree: false,
				partial: false,
			}),
			true,
		);
		assert.equal(
			shouldRenderMaybeHeadInstruction({
				hasRenderedHead: false,
				headInTree: true,
				partial: false,
			}),
			false,
		);
	});

	it('routes by instruction type', () => {
		const state = { hasRenderedHead: false, headInTree: false, partial: false };
		assert.equal(shouldRenderInstruction('head', state), true);
		assert.equal(shouldRenderInstruction('maybe-head', state), true);
	});
});
