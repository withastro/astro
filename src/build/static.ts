import type {Element} from 'domhandler';
import cheerio from 'cheerio';

export function collectStatics(html: string) {
  const statics = new Set<string>();

  const $ = cheerio.load(html);

  const append = (el: Element, attr: string) => {
    const value: string = $(el).attr(attr)!;
    if(value.startsWith('http')) {
      return;
    }
    statics.add(value);
  }

  $('link[href]').each((i, el) => {
    append(el, 'href');
  });

  $('img[src]').each((i, el) => {
    append(el, 'src');
  });

  return statics;
}