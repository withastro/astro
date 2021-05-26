import unified from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import hmr from './hmr';
import injectStyles from './inject-styles';
import moveScripts from './move-scripts';
import type { EsmHmrEngine } from 'snowpack/lib/hmr-server-engine';

export interface OptimizeHtmlOptions {
  css: string[]
  hmrEngine?: EsmHmrEngine
}

/** 
  * Okay, one last time. 
  *
  * Our `h` function has done it's thing and run __renderPage
  * to generate HTML to send to the client.
  *
  * Let's do some FINAL transformations on that HTML.
  * 
  **/
export async function optimizeHtml(content: string, { css, hmrEngine }: OptimizeHtmlOptions) {
  return unified()
      .use(rehypeParse)
      .use(hmr, { hmrEngine })
      .use(injectStyles, { css })
      .use(moveScripts)
      .use(rehypeStringify)
      .process(content)
      .then(({ contents }) => contents.toString());
}
