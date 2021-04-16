import cheerio from 'cheerio';
import prettier from 'prettier';
import { fileURLToPath } from 'url';
/** load html */
export function doc(html) {
  return cheerio.load(html);
}

/** 
  * format the contents of an astro file 
  * @param contents {string}
  */
export function format(contents) {
  return prettier.format(contents, {
      parser: 'astro',
      plugins: [fileURLToPath(new URL('../prettier-plugin-astro', import.meta.url))]
  })
}
