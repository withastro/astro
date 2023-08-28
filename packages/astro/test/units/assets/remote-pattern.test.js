import { expect } from 'chai';
import {
	matchProtocol,
	matchPort,
	matchHostname,
	matchPathname,
	matchPattern,
} from '../../../dist/assets/utils/remotePattern.js';

describe('astro/src/assets/utils/remotePattern', () => {
	const url1 = new URL('https://docs.astro.build/en/getting-started');
	const url2 = new URL('http://preview.docs.astro.build:8080/');
	const url3 = new URL('https://astro.build/');
	const url4 = new URL('https://example.co/');

	describe('remote pattern matchers', () => {
		it('matches protocol', async () => {
			// undefined
			expect(matchProtocol(url1)).to.be.true;

			// defined, true/false
			expect(matchProtocol(url1, 'http')).to.be.false;
			expect(matchProtocol(url1, 'https')).to.be.true;
		});

		it('matches port', async () => {
			// undefined
			expect(matchPort(url1)).to.be.true;

			// defined, but port is empty (default port used in URL)
			expect(matchPort(url1, '')).to.be.true;

			// defined and port is custom
			expect(matchPort(url2, '8080')).to.be.true;
		});

		it('matches hostname (no wildcards)', async () => {
			// undefined
			expect(matchHostname(url1)).to.be.true;

			// defined, true/false
			expect(matchHostname(url1, 'astro.build')).to.be.false;
			expect(matchHostname(url1, 'docs.astro.build')).to.be.true;
		});

		it('matches hostname (with wildcards)', async () => {
			// defined, true/false
			expect(matchHostname(url1, 'docs.astro.build', true)).to.be.true;
			expect(matchHostname(url1, '**.astro.build', true)).to.be.true;
			expect(matchHostname(url1, '*.astro.build', true)).to.be.true;

			expect(matchHostname(url2, '*.astro.build', true)).to.be.false;
			expect(matchHostname(url2, '**.astro.build', true)).to.be.true;

			expect(matchHostname(url3, 'astro.build', true)).to.be.true;
			expect(matchHostname(url3, '*.astro.build', true)).to.be.false;
			expect(matchHostname(url3, '**.astro.build', true)).to.be.false;
		});

		it('matches pathname (no wildcards)', async () => {
			// undefined
			expect(matchPathname(url1)).to.be.true;

			// defined, true/false
			expect(matchPathname(url1, '/')).to.be.false;
			expect(matchPathname(url1, '/en/getting-started')).to.be.true;
		});

		it('matches pathname (with wildcards)', async () => {
			// defined, true/false
			expect(matchPathname(url1, '/en/**', true)).to.be.true;
			expect(matchPathname(url1, '/en/*', true)).to.be.true;
			expect(matchPathname(url1, '/**', true)).to.be.true;

			expect(matchPathname(url2, '/**', true)).to.be.false;
			expect(matchPathname(url2, '/*', true)).to.be.false;
		});

		it('matches patterns', async () => {
			expect(matchPattern(url1, {})).to.be.true;

			expect(
				matchPattern(url1, {
					protocol: 'https',
				})
			).to.be.true;

			expect(
				matchPattern(url1, {
					protocol: 'https',
					hostname: '**.astro.build',
				})
			).to.be.true;

			expect(
				matchPattern(url1, {
					protocol: 'https',
					hostname: '**.astro.build',
					pathname: '/en/**',
				})
			).to.be.true;

			expect(
				matchPattern(url4, {
					protocol: 'https',
					hostname: 'example.com',
				})
			).to.be.false;
		});
	});
});
