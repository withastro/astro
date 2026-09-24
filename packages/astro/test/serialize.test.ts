import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { serializeProps } from '../dist/runtime/server/serialize.js';

describe('serialize', () => {
	it('serializes undefined', () => {
		const input = { a: undefined };
		const output = `{"a":[0]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes null', () => {
		const input = { a: null };
		const output = `{"a":[0,null]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a boolean', () => {
		const input = { a: false };
		const output = `{"a":[0,false]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a number', () => {
		const input = { a: 1 };
		const output = `{"a":[0,1]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a string', () => {
		const input = { a: 'b' };
		const output = `{"a":[0,"b"]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes an object', () => {
		const input = { a: { b: 'c' } };
		const output = `{"a":[0,{"b":[0,"c"]}]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes an array', () => {
		const input = { a: [0] };
		const output = `{"a":[1,[[0,0]]]}`;
		assert.equal(serializeProps(input), output);
	});
	it('can serialize deeply nested data without quadratic quote escaping', () => {
		const input = { a: [{ b: [{ c: [{ d: [{ e: [{ f: [{ g: ['leaf'] }] }] }] }] }] }] };
		const output =
			'{"a":[1,[[0,{"b":[1,[[0,{"c":[1,[[0,{"d":[1,[[0,{"e":[1,[[0,{"f":[1,[[0,{"g":[1,[[0,"leaf"]]]}]]]}]]]}]]]}]]]}]]]}]]]}';
		assert.equal(serializeProps(input), output);
	});
	it('serializes a regular expression', () => {
		const input = { a: /b/ };
		const output = `{"a":[2,"b"]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a Date', () => {
		const input = { a: new Date(0) };
		const output = `{"a":[3,"1970-01-01T00:00:00.000Z"]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a Map', () => {
		const input = { a: new Map([[0, 1]]) };
		const output = `{"a":[4,[[1,[[0,0],[0,1]]]]]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a Set', () => {
		const input = { a: new Set([0, 1, 2, 3]) };
		const output = `{"a":[5,[[0,0],[0,1],[0,2],[0,3]]]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a BigInt', () => {
		const input = { a: BigInt('1') };
		const output = `{"a":[6,"1"]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a URL', () => {
		const input = { a: new URL('https://example.com/') };
		const output = `{"a":[7,"https://example.com/"]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a Uint8Array', () => {
		const input = { a: new Uint8Array([1, 2, 3]) };
		const output = `{"a":[8,[1,2,3]]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a Uint16Array', () => {
		const input = { a: new Uint16Array([1, 2, 3]) };
		const output = `{"a":[9,[1,2,3]]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a Uint32Array', () => {
		const input = { a: new Uint32Array([1, 2, 3]) };
		const output = `{"a":[10,[1,2,3]]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes Infinity and -Infinity', () => {
		const input = { a: Number.POSITIVE_INFINITY, b: Number.NEGATIVE_INFINITY };
		const output = `{"a":[11,1],"b":[11,-1]}`;
		assert.equal(serializeProps(input), output);
	});
	it('cannot serialize a cyclic reference', () => {
		const a: any = {};
		a.b = a;
		const input = { a };
		assert.throws(() => serializeProps(input), { message: /cyclic/ });
	});
	it('cannot serialize a cyclic array', () => {
		const input: any = { foo: ['bar'] };
		input.foo.push(input);
		assert.throws(() => serializeProps(input), { message: /cyclic/ });
	});
	it('cannot serialize a deep cyclic reference', () => {
		const a: any = { b: {} };
		a.b.c = a;
		const input = { a };
		assert.throws(() => serializeProps(input), { message: /cyclic/ });
	});
	it('can serialize shared references that are not cyclic', () => {
		const b = {};
		const input = { a: { b }, b };
		assert.doesNotThrow(() => serializeProps(input));
	});
	it('serializes NaN as null (JSON cannot represent NaN)', () => {
		// NaN is not representable in JSON; serializeProps treats it as null
		const input = { a: Number.NaN };
		const output = `{"a":[0,null]}`;
		assert.equal(serializeProps(input), output);
	});
	it('serializes a mixed-type array', () => {
		const date = new Date(0);
		const output = `{"a":[1,[[0,1],[0,"hello"],[3,"${date.toISOString()}"]]]}`;
		assert.equal(serializeProps({ a: [1, 'hello', date] }), output);
	});
	it('includes component displayName and hydrate in cyclic error message', () => {
		const a: any = {};
		a.b = a;
		const metadata = {
			displayName: 'MyComponent',
			hydrate: 'load',
			astroStaticSlot: true,
		} as const;
		assert.throws(
			() => serializeProps({ a }, metadata),
			(err) => {
				assert.ok(err instanceof Error);
				assert.ok(err.message.includes('MyComponent'), 'should include displayName');
				assert.ok(err.message.includes('load'), 'should include hydrate directive');
				return true;
			},
		);
	});
});
