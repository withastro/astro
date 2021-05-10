import slugger from 'github-slugger';

/**
 * Create Markdown Headers Collector
 * NOTE: micromark has terrible TS types. Instead of fighting with the
 * limited/broken TS types that they ship, we just reach for our good friend, "any".
 */
export function createMarkdownHeadersCollector(scope: string|null) {
  const headers: any[] = [];
  let currentHeader: any;
  return {
    headers,
    headersExtension: {
      enter: {
        atxHeading(node: any) {
          currentHeader = {};
          headers.push(currentHeader);
          this.buffer();
        },
        atxHeadingSequence(node: any) {
          currentHeader.depth = this.sliceSerialize(node).length;
        },
        atxHeadingText(node: any) {
          currentHeader.text = this.sliceSerialize(node);
        },
      } as any,
      exit: {
        atxHeading(node: any) {
          currentHeader.slug = slugger.slug(currentHeader.text);
          this.resume();
          this.tag(`<h${currentHeader.depth} id="${currentHeader.slug}"${scope ? `class="${scope}"` : ''}>`);
          this.raw(currentHeader.text);
          this.tag(`</h${currentHeader.depth}>`);
        },
      } as any,
    } as any,
  };
}
