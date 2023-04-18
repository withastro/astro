import { parseHTML } from 'linkedom';
import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

const root = new URL('./fixtures/image-assets/', import.meta.url);

describe('Markdoc - Image assets', () => {
	let baseFixture;

	before(async () => {
		baseFixture = await loadFixture({
			root,
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await baseFixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('uses public/ image paths unchanged', async () => {
			const res = await baseFixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);
			expect(document.querySelector('#public > img')?.src).to.equal('/favicon.svg');
		});

		it('transforms relative image paths to optimized path', async () => {
			const res = await baseFixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);
			expect(document.querySelector('#relative > img')?.src).to.equal(
				'/_image?href=%2Fsrc%2Fassets%2Frelative%2Foar.jpg%3ForigWidth%3D420%26origHeight%3D630%26origFormat%3Djpg&f=webp'
			);
		});

		it('transforms aliased image paths to optimized path', async () => {
			const res = await baseFixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);
			expect(document.querySelector('#alias > img')?.src).to.equal(
				'/_image?href=%2Fsrc%2Fassets%2Falias%2Fcityscape.jpg%3ForigWidth%3D420%26origHeight%3D280%26origFormat%3Djpg&f=webp'
			);
		});
	});

	describe('build', () => {
		before(async () => {
			await baseFixture.build();
		});

		it('uses public/ image paths unchanged', async () => {
			const html = await baseFixture.readFile('/index.html');
			const { document } = parseHTML(html);
			expect(document.querySelector('#public > img')?.src).to.equal('/favicon.svg');
		});

		it('transforms relative image paths to optimized path', async () => {
			const html = await baseFixture.readFile('/index.html');
			const { document } = parseHTML(html);
			expect(document.querySelector('#relative > img')?.src).to.match(/^\/_astro\/oar.*\.webp$/);
		});

		it('transforms aliased image paths to optimized path', async () => {
			const html = await baseFixture.readFile('/index.html');
			const { document } = parseHTML(html);
			expect(document.querySelector('#alias > img')?.src).to.match(/^\/_astro\/cityscape.*\.webp$/);
		});
	});
});
