import type { AstroComponentMetadata } from '../@types/astro.js';

import { h } from './h.js';

async function renderToStaticMarkup(tag: string, props: Record<string, any>, children: string | undefined) {
  const html = await h(tag, props, Promise.resolve(children));
  return {
    check: (...args: any[]) => true,
    html,
  };
}

export { renderToStaticMarkup };
