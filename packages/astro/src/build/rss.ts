import type { CollectionRSS } from '../@types/astro';
import parser from 'fast-xml-parser';
import { canonicalURL } from './util.js';

/** Validates createCollection.rss */
export function validateRSS(rss: CollectionRSS, srcFile: string): void {
  if (!rss.title) throw new Error(`[${srcFile}] rss.title required`);
  if (!rss.description) throw new Error(`[${srcFile}] rss.description required`);
  if (typeof rss.item !== 'function') throw new Error(`[${srcFile}] rss.item() function required`);
}

type RSSInput<T> = { data: T[]; site: string } & CollectionRSS<T>;
interface RSSOptions {
  srcFile: string;
  feedURL: string;
}

/** Generate RSS 2.0 feed */
export function generateRSS<T>(input: RSSInput<T>, options: RSSOptions): string {
  const { srcFile, feedURL } = options;

  validateRSS(input as any, srcFile);

  let xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"`;

  // xmlns
  if (input.xmlns) {
    for (const [k, v] of Object.entries(input.xmlns)) {
      xml += ` xmlns:${k}="${v}"`;
    }
  }
  xml += `>`;
  xml += `<channel>`;

  // title, description, customData
  xml += `<title><![CDATA[${input.title}]]></title>`;
  xml += `<description><![CDATA[${input.description}]]></description>`;
  xml += `<link>${canonicalURL(feedURL, input.site).href}</link>`;
  if (typeof input.customData === 'string') xml += input.customData;

  // items
  if (!Array.isArray(input.data) || !input.data.length) throw new Error(`[${srcFile}] data() returned no items. Can’t generate RSS feed.`);
  for (const item of input.data) {
    xml += `<item>`;
    const result = input.item(item);
    // validate
    if (typeof result !== 'object') throw new Error(`[${srcFile}] rss.item() expected to return an object, returned ${typeof result}.`);
    if (!result.title) throw new Error(`[${srcFile}] rss.item() returned object but required "title" is missing.`);
    if (!result.link) throw new Error(`[${srcFile}] rss.item() returned object but required "link" is missing.`);
    xml += `<title><![CDATA[${result.title}]]></title>`;
    xml += `<link>${canonicalURL(result.link, input.site).href}</link>`;
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
