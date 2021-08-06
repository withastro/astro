import type { SourceDescription } from 'rollup';

import { renderMarkdownWithFrontmatter } from '@astrojs/markdown-support';
import astroParser from '@astrojs/parser';
import { SourceMapGenerator } from 'source-map';

/** transform .md contents into Astro h() function */
export async function markdownToH(filename: string, contents: string): Promise<SourceDescription> {
  const { astro, content } = await renderMarkdownWithFrontmatter(contents);
  const map = new SourceMapGenerator();
  return {
    code: content,
    map: null,
  };
}
