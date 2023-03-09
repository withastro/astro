import { expect } from 'chai';
import { fileURLToPath, pathToFileURL } from 'node:url';

import File from '../../../dist/core/file/index.js';


describe('File abstraction', () => {
	describe('constructor', () => {
		it('can take a file url', () => {
			let root = new URL('./', import.meta.url);
			let file = new File(import.meta.url, root);
			expect(file.type).to.equal('url');
		});
	
		it('can take an absolute path', () => {
			let root = new URL('./', import.meta.url);
			let path = fileURLToPath(import.meta.url);
			let file = new File(path, root);
			expect(file.type).to.equal('absolute');
		});
	
		it('can take a Vite fs path', () => {
			let root = new URL('./', import.meta.url);
			let path = '/@fs/some/path';
			let file = new File(path, root);
			expect(file.type).to.equal('vite-fs-path');
		});
	
		it('can take a path relative to the root', () => {
			let root = new URL('./', import.meta.url);
			let path = '/src/pages/index.astro';
			let file = new File(path, root);
			expect(file.type).to.equal('root-relative');
		});
	
		it('Defaults to unknown', () => {
			let root = new URL('./', import.meta.url);
			let path = 'some-virtual-id';
			let file = new File(path, root);
			expect(file.type).to.equal('unknown');
		});

		it('Can take an AstroConfig as the second argument', () => {
			let root = new URL('./', import.meta.url);
			let path = fileURLToPath(import.meta.url);
			let file = new File(path, { root });
			expect(file.type).to.equal('absolute');
		});
	});

	describe('toFileURL', () => {
		it('converts from a file URL', () => {
			let root = new URL('./', import.meta.url);
			let file = new File(import.meta.url, root);
			let url = file.toFileURL();
			expect(url.toString()).to.equal(import.meta.url);
		});
	
		it('converts from an absolute path', () => {
			let root = new URL('./', import.meta.url);
			let path = fileURLToPath(import.meta.url);
			let file = new File(path, root);
			let url = file.toFileURL();
			expect(url.toString()).to.equal(pathToFileURL(path).toString());
		});
	
		it('converts from an Vite fs path', () => {
			let root = new URL('./', import.meta.url);
			let path = '/@fs/some/path';
			let file = new File(path, root);
			expect(file.toFileURL().toString()).to.equal('file:///some/path');
		});
	
		it('converts from a path relative to the root', () => {
			let root = new URL('./', import.meta.url);
			let path = '/src/pages/index.astro';
			let file = new File(path, root);

			let expected = new URL('.' + path, root).toString();
			expect(file.toFileURL().toString()).to.equal(expected);
		});
	
		it('Throws converting an unknown', () => {
			let root = new URL('./', import.meta.url);
			let path = 'some-virtual-id';
			let file = new File(path, root);
			try {
				file.toFileURL();
				expect(false).to.equal(true);
			} catch(err) {
				expect(err).to.be.an.instanceOf(Error);
				expect(err.message.startsWith('Cannot create file URL')).to.equal(true);
			}
		});
	})
});
