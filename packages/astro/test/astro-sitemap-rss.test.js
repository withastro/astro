import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Sitemaps', () => {
	let fixture;

	before(async () => {
		console.log('[FIXTURE 1] 💾 LOADING');
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-sitemap-rss/',
			buildOptions: {
				site: 'https://astro.build/',
				sitemap: true,
			},
		});
		console.log('[FIXTURE 1] 🛠 BUILDING');
		await fixture.build();
	});

	after(() => fixture.clean());

	describe('RSS Generation', () => {
		it('generates RSS correctly', async () => {
			console.log('[TEST] Sitemaps > Sitemap Generation > generates RSS correctly');
			const rss = await fixture.readFile('/custom/feed.xml');
			expect(rss).to.equal(
				`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title><![CDATA[MF Doomcast]]></title><description><![CDATA[The podcast about the things you find on a picnic, or at a picnic table]]></description><link>https://astro.build/custom/feed.xml</link><language>en-us</language><itunes:author>MF Doom</itunes:author><item><title><![CDATA[Rap Snitch Knishes (feat. Mr. Fantastik)]]></title><link>https://astro.build/episode/rap-snitch-knishes/</link><guid>https://astro.build/episode/rap-snitch-knishes/</guid><description><![CDATA[Complex named this song the “22nd funniest rap song of all time.”]]></description><pubDate>Tue, 16 Nov 2004 00:00:00 GMT</pubDate><itunes:episodeType>music</itunes:episodeType><itunes:duration>172</itunes:duration><itunes:explicit>true</itunes:explicit></item><item><title><![CDATA[Fazers]]></title><link>https://astro.build/episode/fazers/</link><guid>https://astro.build/episode/fazers/</guid><description><![CDATA[Rhapsody ranked Take Me to Your Leader 17th on its list “Hip-Hop’s Best Albums of the Decade”]]></description><pubDate>Thu, 03 Jul 2003 00:00:00 GMT</pubDate><itunes:episodeType>music</itunes:episodeType><itunes:duration>197</itunes:duration><itunes:explicit>true</itunes:explicit></item><item><title><![CDATA[Rhymes Like Dimes (feat. Cucumber Slice)]]></title><link>https://astro.build/episode/rhymes-like-dimes/</link><guid>https://astro.build/episode/rhymes-like-dimes/</guid><description><![CDATA[Operation: Doomsday has been heralded as an underground classic that established MF Doom's rank within the underground hip-hop scene during the early to mid-2000s.
]]></description><pubDate>Tue, 19 Oct 1999 00:00:00 GMT</pubDate><itunes:episodeType>music</itunes:episodeType><itunes:duration>259</itunes:duration><itunes:explicit>true</itunes:explicit></item></channel></rss>`
			);
		});
	});

	describe('Sitemap Generation', () => {
		it('Generates Sitemap correctly', async () => {
			console.log('[TEST] Sitemaps > Sitemap Generation > Generates Sitemap correctly');
			let sitemap = await fixture.readFile('/sitemap.xml');
			expect(sitemap).to.equal(
				`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://astro.build/episode/fazers/</loc></url><url><loc>https://astro.build/episode/rap-snitch-knishes/</loc></url><url><loc>https://astro.build/episode/rhymes-like-dimes/</loc></url><url><loc>https://astro.build/episodes/</loc></url></urlset>\n`
			);
		});
	});
});

describe('Sitemaps served from subdirectory', () => {
	let fixture;

	before(async () => {
		console.log('[FIXTURE 2] 💾 LOADING');
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-sitemap-rss/',
			buildOptions: {
				site: 'https://astro.build/base-directory/',
				sitemap: true,
			},
		});
		console.log('[FIXTURE 2] 🛠 BUILDING');
		await fixture.build();
	});

	after(() => fixture.clean());

	describe('Sitemap Generation', () => {
		it('Generates Sitemap correctly', async () => {
			console.log('[TEST] Sitemaps served from subdirectory > Sitemap Generation > Generates Sitemap correctly');
			let sitemap = await fixture.readFile('/sitemap.xml');
			expect(sitemap).to.equal(
				`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://astro.build/base-directory/episode/fazers/</loc></url><url><loc>https://astro.build/base-directory/episode/rap-snitch-knishes/</loc></url><url><loc>https://astro.build/base-directory/episode/rhymes-like-dimes/</loc></url><url><loc>https://astro.build/base-directory/episodes/</loc></url></urlset>\n`
			);
		});
	});
});
