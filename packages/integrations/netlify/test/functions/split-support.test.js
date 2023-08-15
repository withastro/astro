import { expect } from 'chai';
import netlifyAdapter from '../../dist/index.js';
import { loadFixture, testIntegration } from './test-utils.js';

describe('Split support', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let _entryPoints;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/split-support/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/split-support/dist/', import.meta.url),
				functionPerRoute: true,
			}),
			site: `http://example.com`,
			integrations: [
				testIntegration({
					setEntryPoints(ep) {
						_entryPoints = ep;
					},
				}),
			],
		});
		await fixture.build();
	});

	it('outputs a correct redirect file', async () => {
		const redir = await fixture.readFile('/_redirects');
		const lines = redir.split(/[\r\n]+/);
		expect(lines.length).to.equal(3);

		expect(lines[0].includes('/blog')).to.be.true;
		expect(lines[0].includes('blog.astro')).to.be.true;
		expect(lines[0].includes('200')).to.be.true;
		expect(lines[1].includes('/')).to.be.true;
		expect(lines[1].includes('index.astro')).to.be.true;
		expect(lines[1].includes('200')).to.be.true;
	});

	describe('Should create multiple functions', () => {
		it('and hit 200', async () => {
			if (_entryPoints) {
				for (const [routeData, filePath] of _entryPoints) {
					if (routeData.route !== '/_image') {
						const { handler } = await import(filePath.toString());
						const resp = await handler({
							httpMethod: 'GET',
							headers: {},
							rawUrl: `http://example.com${routeData.route}`,
							body: '{}',
						});
						expect(resp.statusCode).to.equal(200);
					}
				}
			} else {
				expect(false).to.be.true;
			}
		});
	});
});
