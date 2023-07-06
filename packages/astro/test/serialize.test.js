import { expect } from 'chai';
import { serializeProps } from '../dist/runtime/server/serialize.js';

describe('serialize', () => {
	it('serializes undefined', () => {
		const input = { a: undefined };
		const output = `{"a":[0]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes null', () => {
		const input = { a: null };
		const output = `{"a":[0,null]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a boolean', () => {
		const input = { a: false };
		const output = `{"a":[0,false]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a number', () => {
		const input = { a: 1 };
		const output = `{"a":[0,1]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a string', () => {
		const input = { a: 'b' };
		const output = `{"a":[0,"b"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes an object', () => {
		const input = { a: { b: 'c' } };
		const output = `{"a":[0,{"b":[0,"c"]}]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes an array', () => {
		const input = { a: [0] };
		const output = `{"a":[1,"[[0,0]]"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a regular expression', () => {
		const input = { a: /b/ };
		const output = `{"a":[2,"b"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a Date', () => {
		const input = { a: new Date(0) };
		const output = `{"a":[3,"1970-01-01T00:00:00.000Z"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a Map', () => {
		const input = { a: new Map([[0, 1]]) };
		const output = `{"a":[4,"[[1,\\"[[0,0],[0,1]]\\"]]"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a Set', () => {
		const input = { a: new Set([0, 1, 2, 3]) };
		const output = `{"a":[5,"[[0,0],[0,1],[0,2],[0,3]]"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a BigInt', () => {
		const input = { a: BigInt('1') };
		const output = `{"a":[6,"1"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a URL', () => {
		const input = { a: new URL('https://example.com/') };
		const output = `{"a":[7,"https://example.com/"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a Uint8Array', () => {
		const input = { a: new Uint8Array([1, 2, 3]) };
		const output = `{"a":[8,"[1,2,3]"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a Uint16Array', () => {
		const input = { a: new Uint16Array([1, 2, 3]) };
		const output = `{"a":[9,"[1,2,3]"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('serializes a Uint32Array', () => {
		const input = { a: new Uint32Array([1, 2, 3]) };
		const output = `{"a":[10,"[1,2,3]"]}`;
		expect(serializeProps(input)).to.equal(output);
	});
	it('cannot serialize a cyclic reference', () => {
		const a = {};
		a.b = a;
		const input = { a };
		expect(() => serializeProps(input)).to.throw(/cyclic/);
	});
	it('cannot serialize a cyclic array', () => {
		const input = { foo: ['bar'] };
		input.foo.push(input);
		expect(() => serializeProps(input)).to.throw(/cyclic/);
	});
	it('cannot serialize a deep cyclic reference', () => {
		const a = { b: {} };
		a.b.c = a;
		const input = { a };
		expect(() => serializeProps(input)).to.throw(/cyclic/);
	});
	it('can serialize shared references that are not cyclic', () => {
		const b = {};
		const input = { a: { b, b }, b };
		expect(() => serializeProps(input)).not.to.throw();
	});
});
