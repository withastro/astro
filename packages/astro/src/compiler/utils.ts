import micromark from 'micromark';
import gfmSyntax from 'micromark-extension-gfm';
import matter from 'gray-matter';
// import gfmHtml from 'micromark-extension-gfm/html.js';
import { createMarkdownHeadersCollector } from './markdown/micromark-collect-headers.js';
import { encodeMarkdown } from './markdown/micromark-encode.js';

export interface MarkdownRenderingOptions {
  $scope?: string|null;
  mode?: '.md';
  extensions?: any[];
  htmlExtensions?: any[];
}

/** Shared utility for rendering markdown */
export function renderMarkdown(contents: string, opts?: MarkdownRenderingOptions|null) {
  const { $scope = null, mode = '.md', extensions = [], htmlExtensions = [] } = opts ?? {};
  const { data: { layout, ...frontmatterData }, content } = matter(contents);
  const { headers, headersExtension } = createMarkdownHeadersCollector();
  
  // TODO: scope styles for immediate Markdown children?

  const mdHtml = micromark(content, {
    allowDangerousHtml: true,
    allowDangerousProtocol: true,
    extensions: [gfmSyntax(), ...extensions],
    // TODO: add `gfmHtml` without `micromark-extension-gfm-tagfilter`
    htmlExtensions: [encodeMarkdown, headersExtension, ...htmlExtensions],
  });

  return {
    frontmatter: frontmatterData,
    astro: { headers, source: content },
    content: mdHtml
  };
}
