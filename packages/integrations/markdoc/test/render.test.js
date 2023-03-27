import { parseHTML } from 'linkedom';
import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

async function getFixture(name) {
	return await loadFixture({
		root: new URL(`./fixtures/${name}/`, import.meta.url),
	});
}

describe('Markdoc - render', () => {
	describe('dev', () => {
		it('renders content - simple', async () => {
			const fixture = await getFixture('render-simple');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Simple post');
			const p = document.querySelector('p');
			expect(p.textContent).to.equal('This is a simple Markdoc post.');

			await server.stop();
		});

		it('renders content - with config', async () => {
			const fixture = await getFixture('render-with-config');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with config');
			const textContent = html;

			expect(textContent).to.not.include('Hello');
			expect(textContent).to.include('Hola');
			expect(textContent).to.include(`Konnichiwa`);

			const runtimeVariable = document.querySelector('#runtime-variable');
			expect(runtimeVariable?.textContent?.trim()).to.equal('working!');

			await server.stop();
		});

		it('renders content - with components', async () => {
			const fixture = await getFixture('render-with-components');
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with components');

			// Renders custom shortcode component
			const marquee = document.querySelector('marquee');
			expect(marquee).to.not.be.null;
			expect(marquee.hasAttribute('data-custom-marquee')).to.equal(true);

			// Renders Astro Code component
			const pre = document.querySelector('pre');
			expect(pre).to.not.be.null;
			expect(pre.className).to.equal('astro-code');

			await server.stop();
		});
	});

	describe('build', () => {
		it('renders content - simple', async () => {
			const fixture = await getFixture('render-simple');
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Simple post');
			const p = document.querySelector('p');
			expect(p.textContent).to.equal('This is a simple Markdoc post.');
		});

		it('renders content - with config', async () => {
			const fixture = await getFixture('render-with-config');
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with config');
			const textContent = html;

			expect(textContent).to.not.include('Hello');
			expect(textContent).to.include('Hola');
			expect(textContent).to.include(`Konnichiwa`);

			const runtimeVariable = document.querySelector('#runtime-variable');
			expect(runtimeVariable?.textContent?.trim()).to.equal('working!');
		});

		it('renders content - with components', async () => {
			const fixture = await getFixture('render-with-components');
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);
			const h2 = document.querySelector('h2');
			expect(h2.textContent).to.equal('Post with components');

			// Renders custom shortcode component
			const marquee = document.querySelector('marquee');
			expect(marquee).to.not.be.null;
			expect(marquee.hasAttribute('data-custom-marquee')).to.equal(true);

			// Renders Astro Code component
			const pre = document.querySelector('pre');
			expect(pre).to.not.be.null;
			expect(pre.className).to.equal('astro-code');
		});
	});
});
