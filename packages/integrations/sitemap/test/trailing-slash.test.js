import { loadFixture, readXML } from './test-utils.js';
import { expect } from 'chai';

describe('Trailing slash', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('trailingSlash: ignore', () => {
		describe('build.format: directory', () => {
			before(async () => {
				fixture = await loadFixture({
					root: new URL('./fixtures/trailing-slash/', import.meta.url),
					trailingSlash: 'ignore',
					build: {
						format: 'directory',
					},
				});
				await fixture.build();
			});

			it('URLs end with trailing slash', async () => {
				const data = await readXML(fixture.readFile('/sitemap-0.xml'));
				const urls = data.urlset.url;
				expect(urls[0].loc[0]).to.equal('http://example.com/one/');
			});
		});

		describe('build.format: file', () => {
			before(async () => {
				fixture = await loadFixture({
					root: new URL('./fixtures/trailing-slash/', import.meta.url),
					trailingSlash: 'ignore',
					build: {
						format: 'file',
					},
				});
				await fixture.build();
			});

			it('URLs do not end with trailing slash', async () => {
				const data = await readXML(fixture.readFile('/sitemap-0.xml'));
				const urls = data.urlset.url;
				expect(urls[0].loc[0]).to.equal('http://example.com/one');
			});
		});
	});

	describe('trailingSlash: never', () => {
		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/trailing-slash/', import.meta.url),
				trailingSlash: 'never',
			});
			await fixture.build();
		});

		it('URLs do no end with trailing slash', async () => {
			const data = await readXML(fixture.readFile('/sitemap-0.xml'));
			const urls = data.urlset.url;
			expect(urls[0].loc[0]).to.equal('http://example.com/one');
		});
		describe('with base path', () => {
			before(async () => {
				fixture = await loadFixture({
					root: new URL('./fixtures/trailing-slash/', import.meta.url),
					trailingSlash: 'never',
					base: '/base',
				});
				await fixture.build();
			});

			it('URLs do not end with trailing slash', async () => {
				const data = await readXML(fixture.readFile('/sitemap-0.xml'));
				const urls = data.urlset.url;
				expect(urls[0].loc[0]).to.equal('http://example.com/base/one');
			});
		});
	});

	describe('trailingSlash: always', () => {
		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/trailing-slash/', import.meta.url),
				trailingSlash: 'always',
			});
			await fixture.build();
		});

		it('URLs end with trailing slash', async () => {
			const data = await readXML(fixture.readFile('/sitemap-0.xml'));
			const urls = data.urlset.url;
			expect(urls[0].loc[0]).to.equal('http://example.com/one/');
		});
		describe('with base path', () => {
			before(async () => {
				fixture = await loadFixture({
					root: new URL('./fixtures/trailing-slash/', import.meta.url),
					trailingSlash: 'always',
					base: '/base',
				});
				await fixture.build();
			});

			it('URLs end with trailing slash', async () => {
				const data = await readXML(fixture.readFile('/sitemap-0.xml'));
				const urls = data.urlset.url;
				expect(urls[0].loc[0]).to.equal('http://example.com/base/one/');
			});
		});
	});
});
