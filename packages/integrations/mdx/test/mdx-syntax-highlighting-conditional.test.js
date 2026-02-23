import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Shiki CSS conditional injection', () => {
	describe('With code blocks', () => {
		let fixture;
		let document;

		before(async () => {
			fixture = await loadFixture({
				root: new URL(
					'./fixtures/mdx-syntax-hightlighting-conditional/with-code/',
					import.meta.url,
				),
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			document = parseHTML(html).document;
		});

		it('should inject Shiki CSS when code blocks present', () => {
			const styles = document.querySelector('style')?.textContent || '';
			// Check for Shiki class prefix
			assert.ok(styles.includes('.__a_'), 'Should have Shiki token class definitions');
			// Check for base utility classes
			assert.ok(styles.includes('.astro-code-overflow'), 'Should have overflow class');
		});

		it('should render code blocks with Shiki classes', () => {
			const codeBlock = document.querySelector('pre.astro-code');
			assert.ok(codeBlock, 'Should have code blocks with astro-code class');

			const classes = codeBlock.getAttribute('class');
			assert.ok(classes && classes.includes('__a_'), 'Code block should have Shiki token class');
		});
	});

	describe('Without code blocks', () => {
		let fixture;
		let document;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/mdx-syntax-hightlighting-conditional/no-code/', import.meta.url),
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			document = parseHTML(html).document;
		});

		it('should NOT inject Shiki CSS when no code blocks', () => {
			const styles = document.querySelector('style')?.textContent || '';
			// Should not have Shiki classes
			assert.ok(!styles.includes('.__a_'), 'Should NOT have Shiki token class definitions');
			assert.ok(!styles.includes('.astro-code-overflow'), 'Should NOT have overflow class');
		});

		it('should NOT have code blocks', () => {
			const codeBlocks = document.querySelectorAll('pre.astro-code');
			assert.equal(codeBlocks.length, 0, 'Should not have code blocks');
		});

		it('should still render MDX content', () => {
			assert.equal(document.querySelector('h1')?.textContent, 'Hello from MDX');
			const paragraphs = document.querySelectorAll('p');
			assert.ok(paragraphs.length > 0, 'Should have paragraph elements');
			// Inline code should still be present
			const inlineCode = document.querySelectorAll('code');
			assert.ok(inlineCode.length > 0, 'Should have inline code elements');
		});
	});

	describe('With excluded language', () => {
		let fixture;
		let document;

		before(async () => {
			fixture = await loadFixture({
				root: new URL(
					'./fixtures/mdx-syntax-hightlighting-conditional/excluded-lang/',
					import.meta.url,
				),
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			document = parseHTML(html).document;
		});

		it('should NOT inject CSS for excluded languages', () => {
			const styles = document.querySelector('style')?.textContent || '';
			// Should not have Shiki classes since mermaid is excluded
			assert.ok(!styles.includes('.__a_'), 'Should NOT have Shiki token class definitions');
			assert.ok(!styles.includes('.astro-code-overflow'), 'Should NOT have overflow class');
		});

		it('should still have the code block element (unstyled)', () => {
			// The code block should exist but without Shiki styling
			const codeElements = document.querySelectorAll('pre code');
			assert.ok(codeElements.length > 0, 'Should have code block element');

			// Should have language-mermaid class from markdown processing
			const code = codeElements[0];
			const className = code.getAttribute('class') || '';
			assert.ok(className.includes('language-mermaid'), 'Should have language-mermaid class');
		});

		it('should NOT have astro-code class', () => {
			const astroCodeBlocks = document.querySelectorAll('pre.astro-code');
			assert.equal(astroCodeBlocks.length, 0, 'Should not have astro-code class');
		});
	});
});
