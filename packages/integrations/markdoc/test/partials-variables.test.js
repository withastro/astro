import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';
import markdoc from '../dist/index.js';

const root = new URL('./fixtures/partials-variables/', import.meta.url);

describe('Markdoc - Partials with Variables', () => {
	let baseFixture;

	before(async () => {
		baseFixture = await loadFixture({
			root,
			integrations: [markdoc()],
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

		it('substitutes variables in partials correctly', async () => {
			const res = await baseFixture.fetch('/test');
			const html = await res.text();
			const { document } = parseHTML(html);
			
			// Check that the page title is correct
			assert.equal(document.querySelector('h1')?.textContent, 'Test');
			
			// Check that "Before" and "After" sections are present
			const h2Elements = Array.from(document.querySelectorAll('h2'));
			const h2Texts = h2Elements.map(el => el.textContent);
			assert.ok(h2Texts.includes('Before'));
			assert.ok(h2Texts.includes('After'));
			assert.ok(h2Texts.includes('Foo'));
			assert.ok(h2Texts.includes('Bar'));
			assert.ok(h2Texts.includes('Baz (true)'));
			
			// Check variable substitutions in text content
			const bodyText = document.body.textContent;
			
			// Check that variables were substituted (not left as {% $var %})
			assert.ok(!bodyText.includes('{% $name %}'));
			assert.ok(!bodyText.includes('{% $version %}'));
			assert.ok(!bodyText.includes('{% $test %}'));
			
			// Check that the actual values appear
			assert.ok(bodyText.includes('We have foo that links'));
			assert.ok(bodyText.includes('Name: foo'));
			assert.ok(bodyText.includes('Version: 42'));
			
			// Check that markdown formatting in variables works
			const links = Array.from(document.querySelectorAll('a'));
			const linkFound = links.some(link => 
				link.getAttribute('href') === 'foo.example.com' && 
				link.textContent === 'Link'
			);
			assert.ok(linkFound, 'Markdown link with variable should be rendered correctly');
			
			// Check that bold formatting works with variables
			const strongElements = Array.from(document.querySelectorAll('strong'));
			const boldFound = strongElements.some(strong => strong.textContent === 'foo');
			assert.ok(boldFound, 'Bold formatting with variable should work');
		});
	});

	describe('build', () => {
		before(async () => {
			await baseFixture.build();
		});

		it('substitutes variables in partials correctly', async () => {
			const html = await baseFixture.readFile('/test/index.html');
			const { document } = parseHTML(html);
			
			// Check that the page title is correct
			assert.equal(document.querySelector('h1')?.textContent, 'Test');
			
			// Check that "Before" and "After" sections are present
			const h2Elements = Array.from(document.querySelectorAll('h2'));
			const h2Texts = h2Elements.map(el => el.textContent);
			assert.ok(h2Texts.includes('Before'));
			assert.ok(h2Texts.includes('After'));
			assert.ok(h2Texts.includes('Foo'));
			assert.ok(h2Texts.includes('Bar'));
			assert.ok(h2Texts.includes('Baz (true)'));
			
			// Check variable substitutions in text content
			const bodyText = document.body.textContent;
			
			// Check that variables were substituted (not left as {% $var %})
			assert.ok(!bodyText.includes('{% $name %}'));
			assert.ok(!bodyText.includes('{% $version %}'));
			assert.ok(!bodyText.includes('{% $test %}'));
			
			// Check that the actual values appear
			assert.ok(bodyText.includes('We have foo that links'));
			assert.ok(bodyText.includes('Name: foo'));
			assert.ok(bodyText.includes('Version: 42'));
			
			// Check that markdown formatting in variables works
			const links = Array.from(document.querySelectorAll('a'));
			const linkFound = links.some(link => 
				link.getAttribute('href') === 'foo.example.com' && 
				link.textContent === 'Link'
			);
			assert.ok(linkFound, 'Markdown link with variable should be rendered correctly');
			
			// Check that bold formatting works with variables
			const strongElements = Array.from(document.querySelectorAll('strong'));
			const boldFound = strongElements.some(strong => strong.textContent === 'foo');
			assert.ok(boldFound, 'Bold formatting with variable should work');
		});
	});
});