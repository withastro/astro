import type { Element } from 'domhandler';
import cheerio from 'cheerio';

/** Given an HTML string, collect <link> and <img> tags */
export function collectStatics(html: string) {
  const statics = new Set<string>();

  const $ = cheerio.load(html);

  const append = (el: Element, attr: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const value: string = $(el).attr(attr)!;
    if (value.startsWith('http')) {
      return;
    }
    statics.add(value);
  };

  $('link[href]').each((i, el) => {
    append(el, 'href');
  });

  $('img[src]').each((i, el) => {
    append(el, 'src');
  });

  return statics;
}
