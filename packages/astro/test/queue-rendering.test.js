import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Queue-based rendering - Static', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/queue-rendering/',
			output: 'static',
		});
		await fixture.build();
	});

	describe('Basic rendering', () => {
		it('should render index page successfully', async () => {
			const html = await fixture.readFile('/index.html');

			// Verify basic structure
			assert.ok(html.includes('<title>Queue Rendering Test</title>'));
			assert.ok(html.includes('<h1>Queue Rendering Test</h1>'));
		});

		it('should render simple text and primitives correctly', async () => {
			const html = await fixture.readFile('/index.html');

			assert.ok(html.includes('<p>Simple text rendering</p>'));
			assert.ok(html.includes('<p>Number: 42</p>'));
			assert.ok(html.includes('<p>Boolean: true</p>'));
		});

		it('should render arrays correctly', async () => {
			const html = await fixture.readFile('/index.html');

			assert.ok(html.includes('<li>First</li>'));
			assert.ok(html.includes('<li>Second</li>'));
			assert.ok(html.includes('<li>Third</li>'));

			// Verify order
			const firstPos = html.indexOf('<li>First</li>');
			const secondPos = html.indexOf('<li>Second</li>');
			const thirdPos = html.indexOf('<li>Third</li>');

			assert.ok(firstPos < secondPos);
			assert.ok(secondPos < thirdPos);
		});

		it('should render multiple component instances correctly', async () => {
			const html = await fixture.readFile('/index.html');

			assert.ok(html.includes('data-level="0"'));
			assert.ok(html.includes('data-level="1"'));
			assert.ok(html.includes('data-level="2"'));

			assert.ok(html.includes('Level 0'));
			assert.ok(html.includes('Level 1'));
			assert.ok(html.includes('Level 2'));
		});

		it('should render components with slots correctly', async () => {
			const html = await fixture.readFile('/index.html');

			assert.ok(html.includes('class="with-slot"'));
			assert.ok(html.includes('<h2>Test Title</h2>'));
			assert.ok(html.includes('class="slot-content"'));
			assert.ok(html.includes('<p>Slot content here</p>'));
			assert.ok(html.includes('<p>Multiple paragraphs</p>'));
		});
	});

	describe('Astro directives', () => {
		it('should handle set:html directive', async () => {
			const html = await fixture.readFile('/directives/index.html');

			// set:html should render raw HTML
			assert.ok(html.includes('<strong>Bold text from set:html</strong>'));
		});

		it('should handle set:text directive', async () => {
			const html = await fixture.readFile('/directives/index.html');

			// set:text should escape HTML
			assert.ok(html.includes('&lt;em&gt;This should be escaped&lt;/em&gt;'));
		});

		it('should handle class:list directive', async () => {
			const html = await fixture.readFile('/directives/index.html');

			// class:list should merge classes correctly
			assert.ok(html.includes('class="foo bar baz"'));
		});

		it('should handle inline style objects', async () => {
			const html = await fixture.readFile('/directives/index.html');

			// Style object should be converted to inline CSS
			assert.ok(html.includes('color:red') || html.includes('color: red'));
			assert.ok(html.includes('font-size:20px') || html.includes('font-size: 20px'));
		});
	});

	describe('Client components', () => {
		it('should render client:load components', async () => {
			const html = await fixture.readFile('/client-components/index.html');

			// Should include the component HTML
			assert.ok(html.includes('class="counter"'));
			// React adds HTML comments, so check for the number separately
			assert.ok(html.includes('>5<') || html.includes('<!-- -->5'));

			// Should include hydration script
			assert.ok(html.includes('astro-island'));
			assert.ok(html.includes('client:load'));
		});

		it('should render client:idle components', async () => {
			const html = await fixture.readFile('/client-components/index.html');

			assert.ok(html.includes('>10<') || html.includes('<!-- -->10'));
			assert.ok(html.includes('client:idle'));
		});

		it('should render client:visible components', async () => {
			const html = await fixture.readFile('/client-components/index.html');

			assert.ok(html.includes('>15<') || html.includes('<!-- -->15'));
			assert.ok(html.includes('client:visible'));
		});

		it('should render client:media components', async () => {
			const html = await fixture.readFile('/client-components/index.html');

			assert.ok(html.includes('>20<') || html.includes('<!-- -->20'));
			assert.ok(html.includes('client:media'));
		});

		it('should render client:only components', async () => {
			const html = await fixture.readFile('/client-components/index.html');

			// client:only should not render on server
			// The component placeholder should exist but not the SSR content
			assert.ok(html.includes('client:only'));
		});

		it('should render static components without hydration', async () => {
			const html = await fixture.readFile('/client-components/index.html');

			// Static component should render but not have hydration
			assert.ok(html.includes('Server-side only'));
			assert.ok(html.includes('class="static-component"'));
		});
	});

	describe('Head content', () => {
		it('should include inline styles in head', async () => {
			const html = await fixture.readFile('/head-content/index.html');

			// Inline styles should be hoisted to head or remain inline
			assert.ok(html.includes('.inline-test'));
			assert.ok(html.includes('color: green') || html.includes('color:green'));
		});

		it('should include component styles in head', async () => {
			const html = await fixture.readFile('/head-content/index.html');

			// Component styles should be in head
			assert.ok(html.includes('.with-head'));
			assert.ok(html.includes('border: 1px solid blue') || html.includes('border:1px solid blue'));
		});

		it('should include component scripts', async () => {
			const html = await fixture.readFile('/head-content/index.html');

			// Component scripts should be included
			assert.ok(html.includes('WithHead script loaded'));
		});

		it('should include inline scripts', async () => {
			const html = await fixture.readFile('/head-content/index.html');

			// Inline scripts with is:inline should be included
			assert.ok(html.includes('Inline script executed'));
		});
	});
});

describe('Queue-based rendering - SSR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').App} */
	let app;

	before(async () => {
		// Note: In SSR mode (output: 'server'), pooling is automatically disabled
		// because AppPipeline sets disablePooling: true in the render context.
		// This is correct behavior since pooling provides no benefit in SSR
		// where each request is independent.
		fixture = await loadFixture({
			root: './fixtures/queue-rendering/',
			output: 'server',
			adapter: await import('./test-adapter.js').then((mod) => mod.default()),
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('should render SSR page with queue rendering', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();

		assert.ok(html.includes('<title>Queue Rendering Test</title>'));
		assert.ok(html.includes('<h1>Queue Rendering Test</h1>'));
	});

	it('should render directives page in SSR', async () => {
		const request = new Request('http://example.com/directives');
		const response = await app.render(request);
		const html = await response.text();

		// set:html should render raw HTML
		assert.ok(html.includes('<strong>Bold text from set:html</strong>'));

		// set:text should escape HTML
		assert.ok(html.includes('&lt;em&gt;This should be escaped&lt;/em&gt;'));

		// class:list should merge classes
		assert.ok(html.includes('class="foo bar baz"'));
	});

	it('should render client components in SSR', async () => {
		const request = new Request('http://example.com/client-components');
		const response = await app.render(request);
		const html = await response.text();

		// Should include the component HTML with SSR content
		assert.ok(html.includes('class="counter"'));
		// React adds HTML comments, so check for the number separately
		assert.ok(html.includes('>5<') || html.includes('<!-- -->5'));

		// Should include hydration islands
		assert.ok(html.includes('astro-island'));
		assert.ok(html.includes('client:load'));
	});

	it('should render head content in SSR', async () => {
		const request = new Request('http://example.com/head-content');
		const response = await app.render(request);
		const html = await response.text();

		// Component styles should be in head
		assert.ok(html.includes('.with-head'));

		// Inline scripts should be included
		assert.ok(html.includes('Inline script executed'));
	});
});

describe('Queue-based rendering - Configuration', () => {
	it('should support custom pool size configuration', async () => {
		const fixture = await loadFixture({
			root: './fixtures/queue-rendering/',
			output: 'static',
			experimental: {
				queuedRendering: {
					poolSize: 500,
				},
			},
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');

		// Verify basic rendering still works with custom pool size
		assert.ok(html.includes('<h1>Queue Rendering Test</h1>'));
		assert.ok(html.includes('<p>Simple text rendering</p>'));
	});

	it('should support object configuration', async () => {
		const fixture = await loadFixture({
			root: './fixtures/queue-rendering/',
			output: 'static',
			experimental: {
				queuedRendering: {
					enabled: true,
				},
			},
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');

		// Verify rendering works with boolean config
		assert.ok(html.includes('<h1>Queue Rendering Test</h1>'));
		assert.ok(html.includes('<p>Simple text rendering</p>'));
	});
});
