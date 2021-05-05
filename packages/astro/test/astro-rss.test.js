import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { setupBuild } from './helpers.js';

const RSS = suite('RSS Generation');

setupBuild(RSS, './fixtures/astro-rss');

const snapshot =
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title><![CDATA[MF Doomcast]]></title><description><![CDATA[The podcast about the things you find on a picnic, or at a picnic table]]></description><link>https://mysite.dev/feed/episodes.xml</link><language>en-us</language><itunes:author>MF Doom</itunes:author><item><title><![CDATA[Rap Snitch Knishes (feat. Mr. Fantastik)]]></title><link>https://mysite.dev/episode/rap-snitch-knishes/</link><description><![CDATA[Complex named this song the “22nd funniest rap song of all time.”]]></description><pubDate>Tue, 16 Nov 2004 00:00:00 GMT</pubDate><itunes:episodeType>music</itunes:episodeType><itunes:duration>172</itunes:duration><itunes:explicit>true</itunes:explicit></item><item><title><![CDATA[Fazers]]></title><link>https://mysite.dev/episode/fazers/</link><description><![CDATA[Rhapsody ranked Take Me to Your Leader 17th on its list “Hip-Hop’s Best Albums of the Decade”]]></description><pubDate>Thu, 03 Jul 2003 00:00:00 GMT</pubDate><itunes:episodeType>music</itunes:episodeType><itunes:duration>197</itunes:duration><itunes:explicit>true</itunes:explicit></item><item><title><![CDATA[Rhymes Like Dimes (feat. Cucumber Slice)]]></title><link>https://mysite.dev/episode/rhymes-like-dimes/</link><description><![CDATA[Operation: Doomsday has been heralded as an underground classic that established MF Doom's rank within the underground hip-hop scene during the early to mid-2000s.\n` +
  ']]></description><pubDate>Tue, 19 Oct 1999 00:00:00 GMT</pubDate><itunes:episodeType>music</itunes:episodeType><itunes:duration>259</itunes:duration><itunes:explicit>true</itunes:explicit></item></channel></rss>';

RSS('Generates RSS correctly', async (context) => {
  await context.build();
  let rss = await context.readFile('/feed/episodes.xml');
  assert.match(rss, snapshot);
});

RSS.run();
