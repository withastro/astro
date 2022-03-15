import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

describe('Tailwind', () => {
	let fixture;
	let devServer;

    before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/tailwindcss/',
			renderers: [],
			vite: {
				build: {
					assetsInlineLimit: 0,
				},
			},
		});
	});

    // test HTML and CSS contents for accuracy
    describe('build', () => {
		let $;
		let bundledCSS;

        before(async () => {
			await fixture.build();

			// get bundled CSS (will be hashed, hence DOM query)
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
			const bundledCSSHREF = $('link[rel=stylesheet][href^=/assets/]').attr('href');
			bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
		});

        it('includes used component classes', async () => {
            expect(bundledCSS).to.match(new RegExp('.bg-purple-600{'));
        });

        it('purges unused classes', async () => {
            // tests a random tailwind class that isn't used on the page
            expect(bundledCSS).not.to.match(new RegExp('.bg-blue-600{'));
        });
    });
});
