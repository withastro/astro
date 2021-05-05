import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
import gfmHtml from 'micromark-extension-gfm/html.js';
import { createMarkdownHeadersCollector } from './markdown/micromark-collect-headers.js';
import { encodeMarkdown } from './markdown/micromark-encode.js';
import { encodeAstroMdx } from './markdown/micromark-mdx-astro.js';

export interface MarkdownRenderingOptions {
  mode?: '.md'|'.md.astro';
  extensions?: any[];
  htmlExtensions?: any[];
}

/** Shared utility for rendering markdown */
export function renderMarkdown(contents: string, { mode = '.md', extensions = [], htmlExtensions = [] }: MarkdownRenderingOptions = {}) {
  const { data: { layout, ...frontmatterData }, content } = matter(contents);
  const { headers, headersExtension } = createMarkdownHeadersCollector();

  if (mode === '.md.astro') {
    const astroMdx = encodeAstroMdx();
    extensions.push(...astroMdx.htmlAstro);
    htmlExtensions.push(astroMdx.mdAstro);
  }

  const mdHtml = micromark(content, {
    allowDangerousHtml: true,
    extensions: [gfmSyntax(), ...extensions],
    htmlExtensions: [gfmHtml, encodeMarkdown, headersExtension, ...htmlExtensions],
  });

  return {
    frontmatter: frontmatterData,
    astro: { headers, source: content },
    content: mdHtml
  };
}
