import type { RSSFunction, RSS, RSSResult, RouteData } from '../../@types/astro';

import parser from 'fast-xml-parser';
import { canonicalURL } from '../util.js';

/** Validates getStaticPaths.rss */
export function validateRSS(args: GenerateRSSArgs): void {
  const { rssData, srcFile } = args;
  if (!rssData.title) throw new Error(`[${srcFile}] rss.title required`);
  if (!rssData.description) throw new Error(`[${srcFile}] rss.description required`);
  if ((rssData as any).item) throw new Error(`[${srcFile}] \`item: Function\` should be \`items: Item[]\``);
  if (!Array.isArray(rssData.items)) throw new Error(`[${srcFile}] rss.items should be an array of items`);
}

type GenerateRSSArgs = { site: string; rssData: RSS; srcFile: string; feedURL: string };

/** Generate RSS 2.0 feed */
export function generateRSS(args: GenerateRSSArgs): string {
  validateRSS(args);
  const { srcFile, feedURL, rssData, site } = args;
  if ((rssData as any).item) throw new Error(`[${srcFile}] rss() \`item()\` function was deprecated, and is now \`items: object[]\`.`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"`;

  // xmlns
  if (rssData.xmlns) {
    for (const [k, v] of Object.entries(rssData.xmlns)) {
      xml += ` xmlns:${k}="${v}"`;
    }
  }
  xml += `>`;
  xml += `<channel>`;

  // title, description, customData
  xml += `<title><![CDATA[${rssData.title}]]></title>`;
  xml += `<description><![CDATA[${rssData.description}]]></description>`;
  xml += `<link>${canonicalURL(feedURL, site).href}</link>`;
  if (typeof rssData.customData === 'string') xml += rssData.customData;
  // items
  for (const result of rssData.items) {
    xml += `<item>`;
    // validate
    if (typeof result !== 'object') throw new Error(`[${srcFile}] rss.items expected an object. got: "${JSON.stringify(result)}"`);
    if (!result.title) throw new Error(`[${srcFile}] rss.items required "title" property is missing. got: "${JSON.stringify(result)}"`);
    if (!result.link) throw new Error(`[${srcFile}] rss.items required "link" property is missing. got: "${JSON.stringify(result)}"`);
    xml += `<title><![CDATA[${result.title}]]></title>`;
    xml += `<link>${canonicalURL(result.link, site).href}</link>`;
    if (result.description) xml += `<description><![CDATA[${result.description}]]></description>`;
    if (result.pubDate) {
      // note: this should be a Date, but if user provided a string or number, we can work with that, too.
      if (typeof result.pubDate === 'number' || typeof result.pubDate === 'string') {
        result.pubDate = new Date(result.pubDate);
      } else if (result.pubDate instanceof Date === false) {
        throw new Error('[${filename}] rss.item().pubDate must be a Date');
      }
      xml += `<pubDate>${result.pubDate.toUTCString()}</pubDate>`;
    }
    if (typeof result.customData === 'string') xml += result.customData;
    xml += `</item>`;
  }

  xml += `</channel></rss>`;

  // validate user’s inputs to see if it’s valid XML
  const isValid = parser.validate(xml);
  if (isValid !== true) {
    // If valid XML, isValid will be `true`. Otherwise, this will be an error object. Throw.
    throw new Error(isValid as any);
  }

  return xml;
}

/** Generated function to be run  */
export function generateRssFunction(site: string | undefined, route: RouteData): { generator: RSSFunction; rss?: RSSResult } {
  let result: RSSResult = {} as any;
  return {
    generator: function rssUtility(args: any) {
      if (!site) {
        throw new Error(`[${route.component}] rss() tried to generate RSS but "buildOptions.site" missing in astro.config.mjs`);
      }
      const { dest, ...rssData } = args;
      const feedURL = dest || '/feed.xml';
      result.url = feedURL;
      result.xml = generateRSS({ rssData, site, srcFile: route.component, feedURL });
    },
    rss: result,
  };
}
