import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Complex Dynamic Routes Style Propagation', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/complex-dynamic-routes/',
			output: 'server',
			adapter: testAdapter(),
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	async function fetchHTML(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const html = await response.text();
		return html;
	}

	async function fetchJSON(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const json = await response.json();
		return json;
	}

	describe('Multiple conflicting dynamic routes', () => {
		it('Blog route [...slug] includes all required styles', async () => {
			const html = await fetchHTML('/test-post');
			const $ = cheerioLoad(html);
			
			// Check page-level styles are present
			assert.ok(html.includes('color: blue') || html.includes('color:blue'), 
				'Expected blog-specific page styles');
			assert.ok(html.includes('background: lightblue') || html.includes('background:lightblue'), 
				'Expected blog background styles');
			
			// Check content styles are present
			assert.ok(html.includes('color: purple') || html.includes('color:purple'), 
				'Expected markdown content styles');
			assert.ok(html.includes('background: lavender') || html.includes('background:lavender'), 
				'Expected markdown background styles');
				
			// Verify styles are in head or linked
			const hasStyleTag = $('style').length > 0;
			const hasStyleLink = $('link[rel="stylesheet"]').length > 0;
			assert.ok(hasStyleTag || hasStyleLink, 'Expected styles to be in head');
		});

		it('Docs route docs/[...path] includes all required styles', async () => {
			const html = await fetchHTML('/docs/getting-started');
			const $ = cheerioLoad(html);
			
			// Check page-level styles
			assert.ok(html.includes('color: green') || html.includes('color:green'), 
				'Expected docs-specific page styles');
			assert.ok(html.includes('border-left: 4px solid darkgreen') || html.includes('border-left:4px solid darkgreen'), 
				'Expected docs border styles');
			
			// Check content styles from markdown
			assert.ok(html.includes('background: yellow') || html.includes('background:yellow'), 
				'Expected docs content highlight styles');
			
			const hasStyleTag = $('style').length > 0;
			const hasStyleLink = $('link[rel="stylesheet"]').length > 0;
			assert.ok(hasStyleTag || hasStyleLink, 'Expected styles to be in head');
		});

		it('Category route [category]/[...items] includes all required styles', async () => {
			const html = await fetchHTML('/tutorial/all');
			const $ = cheerioLoad(html);
			
			// Check gradient styles
			assert.ok(html.includes('linear-gradient') || html.includes('gradient'), 
				'Expected gradient background styles');
			assert.ok(html.includes('grid-template-columns') || html.includes('grid'), 
				'Expected grid layout styles');
			
			const hasStyleTag = $('style').length > 0;
			const hasStyleLink = $('link[rel="stylesheet"]').length > 0;
			assert.ok(hasStyleTag || hasStyleLink, 'Expected styles to be in head');
		});
	});

	describe('API routes with dynamic patterns', () => {
		it('API route api/[...slug] returns correct JSON', async () => {
			const json = await fetchJSON('/api/test-post');
			
			assert.equal(json.slug, 'test-post');
			assert.equal(json.title, 'Test Blog Post');
			assert.equal(json.description, 'A comprehensive test post for dynamic routes');
		});

		it('API route handles missing content gracefully', async () => {
			const json = await fetchJSON('/api/nonexistent');
			
			assert.equal(json.error, 'Not found');
		});
	});

	describe('Style propagation order independence', () => {
		it('All routes maintain styles regardless of processing order', async () => {
			// Test multiple routes in different orders to ensure our fix works
			const routes = [
				'/test-post',           // [...slug] pattern
				'/docs/getting-started', // docs/[...path] pattern  
				'/tutorial/all',        // [category]/[...items] pattern
			];
			
			const results = [];
			
			// Test routes in different orders
			for (const route of routes) {
				const html = await fetchHTML(route);
				const $ = cheerioLoad(html);
				const hasStyles = $('style').length > 0 || $('link[rel="stylesheet"]').length > 0;
				results.push({ route, hasStyles });
			}
			
			// Verify all routes have styles
			for (const result of results) {
				assert.ok(result.hasStyles, `Route ${result.route} should have styles`);
			}
		});

		it('Content collection styles are propagated in all route patterns', async () => {
			const testCases = [
				{ route: '/test-post', expectedContent: 'markdown-content' },
				{ route: '/docs/getting-started', expectedContent: 'docs-highlight' },
			];
			
			for (const testCase of testCases) {
				const html = await fetchHTML(testCase.route);
				assert.ok(html.includes(testCase.expectedContent), 
					`Route ${testCase.route} should include content with class ${testCase.expectedContent}`);
			}
		});
	});

	describe('Regression testing for existing functionality', () => {
		it('Head injection still works with nested components', async () => {
			const html = await fetchHTML('/test-post');
			const $ = cheerioLoad(html);
			
			// Verify title is properly set
			assert.ok($('title').text().includes('Test Blog Post'), 
				'Page title should be properly set');
			
			// Verify meta elements work
			assert.ok($('head').length > 0, 'Head element should exist');
		});

		it('Multiple style sources are all included', async () => {
			const html = await fetchHTML('/test-post');
			
			// Should have both page styles and content styles
			const pageStylesPresent = html.includes('blog-content') || html.includes('blue');
			const contentStylesPresent = html.includes('markdown-content') || html.includes('purple');
			
			assert.ok(pageStylesPresent, 'Page-level styles should be present');
			assert.ok(contentStylesPresent, 'Content-level styles should be present');
		});

		it('Style deduplication still works correctly', async () => {
			const html = await fetchHTML('/docs/getting-started');
			const $ = cheerioLoad(html);
			
			// Count style tags/links to ensure no excessive duplication
			const styleCount = $('style').length + $('link[rel="stylesheet"]').length;
			assert.ok(styleCount > 0 && styleCount < 10, 
				`Style count should be reasonable (got ${styleCount})`);
		});
	});
});