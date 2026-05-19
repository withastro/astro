import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

type Route = {
	description: string;
	url: string;
	h1?: string;
	p?: string;
	scriptContent?: string;
	htmlMatch?: string;
	fourOhFour?: boolean;
};

const routes: Route[] = [
	{
		description: 'matches / to index.astro',
		url: '/',
		h1: 'index.astro',
	},
	{
		description: 'matches /injected-a to to-inject.astro',
		url: '/injected-a',
		h1: 'to-inject.astro',
		scriptContent: 'console.log("to-inject.astro");',
	},
	{
		description: 'matches /injected-b to to-inject.astro',
		url: '/injected-b',
		h1: 'to-inject.astro',
		scriptContent: 'console.log("to-inject.astro");',
	},
	{
		description: 'matches /dynamic-a/id-1 to [id].astro',
		url: '/dynamic-a/id-1',
		h1: '[id].astro',
		p: 'id-1',
	},
	{
		description: 'matches /dynamic-a/id-2 to [id].astro',
		url: '/dynamic-a/id-2',
		h1: '[id].astro',
		p: 'id-2',
	},
	{
		description: 'matches /dynamic-b/id-1 to [id].astro',
		url: '/dynamic-b/id-1',
		h1: '[id].astro',
		p: 'id-1',
	},
	{
		description: 'matches /dynamic-b/id-2 to [id].astro',
		url: '/dynamic-b/id-2',
		h1: '[id].astro',
		p: 'id-2',
	},
	{
		description: 'matches /dynamic-c/id-2 to [id].astro when the route is injected with a URL',
		url: '/dynamic-c/id-2',
		h1: '[id].astro',
		p: 'id-2',
	},
];

function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

describe('Reuse injected entrypoint', () => {
	describe('build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/reuse-injected-entrypoint/',
				outDir: './dist/reuse-injected-entrypoint-build/',
			});
			await fixture.build();
		});

		routes.forEach(({ description, url, fourOhFour, h1, p, htmlMatch, scriptContent }) => {
			const isEndpoint = htmlMatch && !h1 && !p;

			it(description, async () => {
				const htmlFile = isEndpoint ? url : `${appendForwardSlash(url)}index.html`;

				if (fourOhFour) {
					assert.equal(fixture.pathExists(htmlFile), false);
					return;
				}

				const html = await fixture.readFile(htmlFile);
				const $ = cheerioLoad(html);

				if (h1) {
					assert.equal($('h1').text(), h1);
				}

				if (p) {
					assert.equal($('p').text(), p);
				}

				if (htmlMatch) {
					assert.equal(html, htmlMatch);
				}

				if (scriptContent) {
					const scriptTags = $('script[type="module"]').toArray();
					const scriptFound = scriptTags.some((script) => {
						const scriptText = $(script).text();
						return scriptText.includes(scriptContent.trim());
					});
					assert(scriptFound, `Expected script content to be injected in SSG ${url}`);
				}
			});
		});
	});
});
