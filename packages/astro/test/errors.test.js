import { expect } from 'chai';
import { isWindows, loadFixture } from './test-utils.js';

describe('Error display', () => {
	if (isWindows) return;

	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/errors',
			renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-react', '@astrojs/renderer-solid', '@astrojs/renderer-svelte', '@astrojs/renderer-vue'],
			vite: {
				optimizeDeps: false, // necessary to prevent Vite throwing on bad files
			},
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('Astro', () => {
		it('syntax error in template', async () => {
			const res = await fixture.fetch('/astro-syntax-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Unexpected &quot;}&quot;');
		});

		it('syntax error in frontmatter', async () => {
			const res = await fixture.fetch('/astro-frontmatter-syntax-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Unexpected end of frontmatter');
		});

		it('runtime error', async () => {
			const res = await fixture.fetch('/astro-runtime-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('ReferenceError: title is not defined');

			// TODO: improve and test stacktrace
		});

		it('hydration error', async () => {
			const res = await fixture.fetch('/astro-hydration-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Error: invalid hydration directive');
		});

		it('client:media error', async () => {
			const res = await fixture.fetch('/astro-client-media-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Error: Media query must be provided');
		});
	});

	describe('JS', () => {
		it('syntax error', async () => {
			const res = await fixture.fetch('/js-syntax-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Parse failure');
		});

		it('runtime error', async () => {
			const res = await fixture.fetch('/js-runtime-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('ReferenceError: undefinedvar is not defined');
		});
	});

	describe('Preact', () => {
		it('syntax error', async () => {
			const res = await fixture.fetch('/preact-syntax-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Syntax error');
		});

		it('runtime error', async () => {
			const res = await fixture.fetch('/preact-runtime-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Error: PreactRuntimeError');
		});
	});

	describe('React', () => {
		it('syntax error', async () => {
			const res = await fixture.fetch('/react-syntax-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Syntax error');
		});

		it('runtime error', async () => {
			const res = await fixture.fetch('/react-runtime-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Error: ReactRuntimeError');
		});
	});

	describe('Solid', () => {
		it('syntax error', async () => {
			const res = await fixture.fetch('/solid-syntax-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Syntax error');
		});

		it('runtime error', async () => {
			const res = await fixture.fetch('/solid-runtime-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Error: SolidRuntimeError');
		});
	});

	describe('Svelte', () => {
		it('syntax error', async () => {
			const res = await fixture.fetch('/svelte-syntax-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Internal Error');
		});

		it('runtime error', async () => {
			const res = await fixture.fetch('/svelte-runtime-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.include('Error: SvelteRuntimeError');
		});
	});

	describe('Vue', () => {
		it('syntax error', async () => {
			const res = await fixture.fetch('/vue-syntax-error');
			const body = await res.text();

			expect(res.status).to.equal(500);
			expect(body).to.include('Parse failure');
		});

		it('runtime error', async () => {
			const res = await fixture.fetch('/vue-runtime-error');

			expect(res.status).to.equal(500);

			const body = await res.text();

			expect(body).to.match(/Cannot read.*undefined/); // note: error differs slightly between Node versions
		});
	});
});
