import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { slotName } from '../../dist/server.js';

describe('server', () => {
	describe('slotName', () => {
		it('converts kebab-case to camelCase', () => {
			assert.equal(slotName('my-slot'), 'mySlot');
		});

		it('converts snake_case to camelCase', () => {
			assert.equal(slotName('my_slot'), 'mySlot');
		});

		it('handles multiple separators', () => {
			assert.equal(slotName('my-long-slot-name'), 'myLongSlotName');
		});

		it('handles mixed separators', () => {
			assert.equal(slotName('my-slot_name'), 'mySlotName');
		});

		it('trims whitespace', () => {
			assert.equal(slotName('  my-slot  '), 'mySlot');
		});

		it('returns simple names unchanged', () => {
			assert.equal(slotName('default'), 'default');
		});

		it('handles single character after separator', () => {
			assert.equal(slotName('a-b'), 'aB');
		});

		it('handles empty string', () => {
			assert.equal(slotName(''), '');
		});

		it('only converts lowercase letters after separators', () => {
			// Uppercase letters after separators are not matched by the regex [a-z]
			assert.equal(slotName('my-Slot'), 'my-Slot');
		});
	});
});
