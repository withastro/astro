import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Redirects', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/redirects/',
			redirects: {
				'/one': '/',
				'/two': '/',
				'/three': {
					status: 302,
					destination: '/',
				},
				'/blog/[...slug]': '/team/articles/[...slug]',
			},
			trailingSlash: 'always',
			experimental: {
				redirects: true,
			},
		});
		await fixture.build();
	});

	async function getConfig() {
		const json = await fixture.readFile('../.vercel/output/config.json');
		const config = JSON.parse(json);

		return config;
	}

	it('define static routes', async () => {
		const config = await getConfig();

		const oneRoute = config.routes.find((r) => r.src === '/\\/one');
		expect(oneRoute.headers.Location).to.equal('/');
		expect(oneRoute.status).to.equal(301);

		const twoRoute = config.routes.find((r) => r.src === '/\\/two');
		expect(twoRoute.headers.Location).to.equal('/');
		expect(twoRoute.status).to.equal(301);

		const threeRoute = config.routes.find((r) => r.src === '/\\/three');
		expect(threeRoute.headers.Location).to.equal('/');
		expect(threeRoute.status).to.equal(302);
	});

	it('defines dynamic routes', async () => {
		const config = await getConfig();

		const blogRoute = config.routes.find((r) => r.src.startsWith('/\\/blog'));
		expect(blogRoute).to.not.be.undefined;
		expect(blogRoute.headers.Location.startsWith('/team/articles')).to.equal(true);
		expect(blogRoute.status).to.equal(301);
	});

	it('define trailingSlash redirect for sub pages', async () => {
		const config = await getConfig();

		const subpathRoute = config.routes.find((r) => r.src === '/\\/subpage');
		expect(subpathRoute).to.not.be.undefined;
		expect(subpathRoute.headers.Location).to.equal('/subpage/');
	});

	it('does not define trailingSlash redirect for root page', async () => {
		const config = await getConfig();
		expect(config.routes.find((r) => r.src === '/')).to.be.undefined;
	});
});
