import prettier from 'prettier';
import { fileURLToPath } from 'url';
/**
 * format the contents of an astro file
 * @param contents {string}
 */
export function format(contents) {
  return prettier.format(contents, {
    parser: 'astro',
    plugins: [fileURLToPath(new URL('../', import.meta.url))],
  });
}
