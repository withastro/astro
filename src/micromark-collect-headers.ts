import slugger from 'github-slugger';

// NOTE: micromark has terrible TS types. Instead of fighting with the
// limited/broken TS types that they ship, we just reach for our good friend, "any".
export function createMarkdownHeadersCollector() {
  const headers: any[] = [];
  let currentHeader: any;
  return {
    headers,
    headersExtension: {
      enter: {
        atxHeading(node: any) {
          currentHeader = {};
          headers.push(currentHeader);
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
          this.tag(`<h${currentHeader.depth} id="${currentHeader.slug}">`);
          this.raw(currentHeader.text);
          this.tag(`</h${currentHeader.depth}>`);

          // console.log(this.sliceSerialize(node));
        },
      } as any,
    } as any,
  };
}
