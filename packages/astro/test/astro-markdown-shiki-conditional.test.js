import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Markdown Shiki CSS conditional injection', () => {
	describe('With code blocks', () => {
		let fixture;
		let $;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-markdown-shiki-conditional/with-code/',
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		it('should inject Shiki CSS when code blocks present', () => {
			const styles = $('style').text();
			// Check for Shiki class prefix
			assert.ok(styles.includes('.__a_'), 'Should have Shiki token class definitions');
			// Check for base utility classes
			assert.ok(styles.includes('.astro-code-overflow'), 'Should have overflow class');
		});

		it('should render code blocks with Shiki classes', () => {
			const codeBlock = $('pre.astro-code');
			assert.ok(codeBlock.length > 0, 'Should have code blocks with astro-code class');

			const classes = codeBlock.attr('class');
			assert.ok(classes && classes.includes('__a_'), 'Code block should have Shiki token class');
		});
	});

	describe('Without code blocks', () => {
		let fixture;
		let $;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-markdown-shiki-conditional/no-code/',
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		it('should NOT inject Shiki CSS when no code blocks', () => {
			const styles = $('style').text();
			// Should not have Shiki classes
			assert.ok(!styles.includes('.__a_'), 'Should NOT have Shiki token class definitions');
			assert.ok(!styles.includes('.astro-code-overflow'), 'Should NOT have overflow class');
		});

		it('should NOT have code blocks', () => {
			const codeBlocks = $('pre.astro-code');
			assert.equal(codeBlocks.length, 0, 'Should not have code blocks');
		});

		it('should still render markdown content', () => {
			assert.equal($('h1').text(), 'Hello world');
			assert.ok($('p').length > 0, 'Should have paragraph elements');
			// Inline code should still be present
			assert.ok($('code').length > 0, 'Should have inline code elements');
		});
	});

	describe('With excluded language', () => {
		let fixture;
		let $;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-markdown-shiki-conditional/excluded-lang/',
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		it('should NOT inject CSS for excluded languages', () => {
			const styles = $('style').text();
			// Should not have Shiki classes since mermaid is excluded
			assert.ok(!styles.includes('.__a_'), 'Should NOT have Shiki token class definitions');
			assert.ok(!styles.includes('.astro-code-overflow'), 'Should NOT have overflow class');
		});

		it('should still have the code block element (unstyled)', () => {
			// The code block should exist but without Shiki styling
			const codeElements = $('pre code');
			assert.ok(codeElements.length > 0, 'Should have code block element');

			// Should have language-mermaid class from markdown processing
			const code = codeElements.first();
			const className = code.attr('class') || '';
			assert.ok(className.includes('language-mermaid'), 'Should have language-mermaid class');
		});

		it('should NOT have astro-code class', () => {
			const astroCodeBlocks = $('pre.astro-code');
			assert.equal(astroCodeBlocks.length, 0, 'Should not have astro-code class');
		});
	});
});
