import { resolveEntrypoint } from '../dist/path.js';
import { expect } from 'chai';

describe('resolveEntrypoint', () => {
	it('handles fully resolved URLs', () => {
		const root = new URL('file://test/path/usr/');
		const entrypoint = new URL('./src/item.ts', root);
		const output = resolveEntrypoint(entrypoint, root);
		expect(output).to.equal('/src/item.ts');
	})
	it('handles relative paths', () => {
		const root = new URL('file://test/path/usr/');
		const entrypoint = './src/item.ts';
		const output = resolveEntrypoint(entrypoint, root);
		expect(output).to.equal('/src/item.ts');
	})
	it('handles root-relative specifiers', () => {
		const root = new URL('file://test/path/usr/');
		const entrypoint = '/src/item.ts';
		const output = resolveEntrypoint(entrypoint, root);
		expect(output).to.equal('/src/item.ts');
	})
	it('handles virtual modules', () => {
		const root = new URL('file://test/path/usr/');
		const entrypoint = 'virtual:test-entrypoint';
		const output = resolveEntrypoint(entrypoint, root);
		expect(output).to.equal(entrypoint);
	})
	it('handles fully resolved node_modules paths', () => {
		const root = new URL('file://test/path/usr/');
		const entrypoint = new URL('file://test/path/usr/node_modules/@astrojs/preact/dist/server.js');
		const output = resolveEntrypoint(entrypoint, root);
		expect(output).to.equal('/node_modules/@astrojs/preact/dist/server.js');
	})
	it('handles package specifier', () => {
		const root = new URL('file://test/path/usr/');
		const entrypoint = '@astrojs/preact/server';
		const output = resolveEntrypoint(entrypoint, root);
		expect(output).to.equal(entrypoint);
	})
});
