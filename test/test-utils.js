import cheerio from 'cheerio';

export function doc(html) {
  return cheerio.load(html);
}
