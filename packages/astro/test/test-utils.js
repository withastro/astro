import cheerio from 'cheerio';

/** load html */
export function doc(html) {
  return cheerio.load(html);
}

