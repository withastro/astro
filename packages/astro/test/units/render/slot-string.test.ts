import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SlotString } from '../../../dist/runtime/server/render/slot.js';
import { createRenderInstruction } from '../../../dist/runtime/server/render/instruction.js';

describe('SlotString', () => {
	it('toString() includes script instruction content', () => {
		const script = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '<script type="module" src="/test.js"></script>',
		});
		const slot = new SlotString('<meta charset="utf-8">', [script]);
		assert.ok(slot.toString().includes('<script type="module" src="/test.js"></script>'));
		assert.ok(slot.toString().includes('<meta charset="utf-8">'));
	});

	it('valueOf() includes script instruction content', () => {
		const script = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '<script type="module" src="/test.js"></script>',
		});
		const slot = new SlotString('<meta charset="utf-8">', [script]);
		assert.ok(slot.valueOf().includes('<script type="module" src="/test.js"></script>'));
	});

	it('string concatenation includes script instruction content', () => {
		const script = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '<script type="module" src="/test.js"></script>',
		});
		const slot = new SlotString('<meta charset="utf-8">', [script]);
		const result = '' + slot;
		assert.ok(result.includes('<script type="module" src="/test.js"></script>'));
		assert.ok(result.includes('<meta charset="utf-8">'));
	});

	it('+= concatenation includes script instruction content', () => {
		const script = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '<script type="module" src="/test.js"></script>',
		});
		const slot = new SlotString('<meta charset="utf-8">', [script]);
		let head = '<head>';
		head += slot;
		head += '</head>';
		assert.ok(head.includes('<script type="module" src="/test.js"></script>'));
	});

	it('toString() works without instructions', () => {
		const slot = new SlotString('<meta charset="utf-8">', null);
		assert.equal(slot.toString(), '<meta charset="utf-8">');
	});

	it('toString() works with non-script instructions', () => {
		const instr = createRenderInstruction({ type: 'head' });
		const slot = new SlotString('<meta charset="utf-8">', [instr]);
		// Non-script instructions should not be appended to string output
		assert.equal(slot.toString(), '<meta charset="utf-8">');
	});
});
