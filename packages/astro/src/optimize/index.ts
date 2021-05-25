import unified from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import injectStyles from './inject-styles';

export interface OptimizeHtmlOptions {
  css: string[]
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
export async function optimizeHtml(content: string, { css }: OptimizeHtmlOptions) {
  return unified()
      .use(rehypeParse)
      .use(injectStyles, { css })
      .use(rehypeStringify)
      .process(content)
      .then(({ contents }) => contents.toString());
}
