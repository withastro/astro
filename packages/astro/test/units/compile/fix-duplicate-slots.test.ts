import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fixDuplicateSlotKeys } from '../../../dist/core/compile/fix-duplicate-slots.js';

describe('fixDuplicateSlotKeys', () => {
	it('returns code unchanged when there are no $$renderComponent calls', () => {
		const code = 'const x = 1;';
		assert.equal(fixDuplicateSlotKeys(code), code);
	});

	it('returns code unchanged when slots have no duplicate keys', () => {
		const code =
			'$$renderComponent($$result, "Foo", Foo, {}, { "a": ($$result) => $$render`<div>foo</div>`, "b": ($$result) => $$render`<div>bar</div>` })';
		assert.equal(fixDuplicateSlotKeys(code), code);
	});

	it('merges duplicate slot keys into an array-returning function', () => {
		const code =
			'$$renderComponent($$result, "Foo", Foo, {}, { "a": ($$result) => $$render`<div>foo</div>`, "a": ($$result) => $$render`<div>bar</div>` })';
		const result = fixDuplicateSlotKeys(code);

		// Should not contain duplicate "a" keys
		const keyMatches = result.match(/"a":/g);
		assert.equal(keyMatches?.length, 1, 'should have exactly one "a" key');

		// Should contain array syntax merging the values
		assert.ok(result.includes(') => ['), 'should use array merging');
	});

	it('preserves surrounding code when fixing duplicates', () => {
		const code =
			'const before = 1;\n$$renderComponent($$result, "Foo", Foo, {}, { "a": ($$result) => $$render`1`, "a": ($$result) => $$render`2` })\nconst after = 2;';
		const result = fixDuplicateSlotKeys(code);

		assert.ok(result.startsWith('const before = 1;'), 'preserves code before');
		assert.ok(result.endsWith('const after = 2;'), 'preserves code after');
	});

	it('handles three duplicate entries', () => {
		const code =
			'$$renderComponent($$result, "Foo", Foo, {}, { "a": ($$result) => $$render`1`, "a": ($$result) => $$render`2`, "a": ($$result) => $$render`3` })';
		const result = fixDuplicateSlotKeys(code);

		const keyMatches = result.match(/"a":/g);
		assert.equal(keyMatches?.length, 1, 'should have exactly one "a" key');
	});

	it('handles mixed duplicate and unique keys', () => {
		const code =
			'$$renderComponent($$result, "Foo", Foo, {}, { "a": ($$result) => $$render`1`, "b": ($$result) => $$render`2`, "a": ($$result) => $$render`3` })';
		const result = fixDuplicateSlotKeys(code);

		const aMatches = result.match(/"a":/g);
		const bMatches = result.match(/"b":/g);
		assert.equal(aMatches?.length, 1, 'should have one "a" key');
		assert.equal(bMatches?.length, 1, 'should have one "b" key');
	});

	it('handles nested template literals in slot values', () => {
		const code =
			'$$renderComponent($$result, "Foo", Foo, {}, { "a": ($$result) => $$render`${true && $$render`<div>foo</div>`}`, "a": ($$result) => $$render`${true && $$render`<div>bar</div>`}` })';
		const result = fixDuplicateSlotKeys(code);

		const keyMatches = result.match(/"a":/g);
		assert.equal(keyMatches?.length, 1, 'should have exactly one "a" key');
		assert.ok(result.includes(') => ['), 'should use array merging');
	});

	it('handles multiple $$renderComponent calls where only one has duplicates', () => {
		const code = [
			'$$renderComponent($$result, "Foo", Foo, {}, { "a": ($$result) => $$render`ok` })',
			'$$renderComponent($$result, "Bar", Bar, {}, { "a": ($$result) => $$render`1`, "a": ($$result) => $$render`2` })',
		].join('\n');
		const result = fixDuplicateSlotKeys(code);

		// First call should be unchanged
		assert.ok(result.includes('{ "a": ($$result) => $$render`ok` }'), 'first call unchanged');
		// Second call should be fixed
		const secondCallMatch = result.match(/Bar,.*?"a":/);
		assert.ok(secondCallMatch, 'second call exists');
	});
});
