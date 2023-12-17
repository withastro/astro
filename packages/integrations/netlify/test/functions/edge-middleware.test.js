import { expect } from 'chai';
import { loadFixture } from "@astrojs/test-utils"

describe('Middleware', () => {
	const root = new URL('./fixtures/middleware/', import.meta.url)

	describe("edgeMiddleware: false", () => {
		let fixture
		before(async () => {
			process.env.EDGE_MIDDLEWARE = 'false';
			fixture = await loadFixture({ root });
			await fixture.build();
		})
		
		it('emits no edge function', async () => {
			expect(fixture.pathExists('../.netlify/edge-functions/middleware/middleware.mjs')).to.be.false
		});

		it('applies middleware to static files at build-time', async () => {
			// prerendered page has middleware applied at build time
			const prerenderedPage = await fixture.readFile('prerender/index.html')
			expect(prerenderedPage).to.contain("<title>Middleware</title>")
		});
	})
	

	describe("edgeMiddleware: true", () => {
		let fixture
		before(async () => {
			process.env.EDGE_MIDDLEWARE = 'true';
			fixture = await loadFixture({ root });
			await fixture.build();
		})

		it('emits an edge function', async () => {
			const contents = await fixture.readFile('../.netlify/edge-functions/middleware/middleware.mjs')
			expect(contents.includes('"Hello world"')).to.be.false;
		})

		it('does not apply middleware during prerendering', async () => {
			const prerenderedPage = await fixture.readFile('prerender/index.html')
			expect(prerenderedPage).to.contain("<title></title>")
		})
	})
});
