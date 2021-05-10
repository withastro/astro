import type { MicromarkExtension } from '../../@types/micromark';

/** See https://github.com/micromark/micromark/blob/14d86e04df9c1510dad544cb835e6df85b899107/lib/compile/html.mjs */
export function createMicromarkScopeStyles(scope: string): MicromarkExtension {
  return {
    enter: {
      paragraph(node: any) {
        this.tag(`<p class="${scope}">`);
      },
      blockquote(node: any) {
        this.tag(`<blockquote class="${scope}">`)
      },
      listItemMarker(node: any) {
        this.tag(`<li class="${scope}">`)
      },
      listOrdered(node: any) {
        this.tag(`<ol class="${scope}">`)
      },
      listUnordered(node: any) {
        this.tag(`<ul class="${scope}">`)
      },
      emphasis(node: any) {
        this.tag(`<em class="${scope}">`);
      },
      strong(node: any) {
        this.tag(`<strong class="${scope}">`);
      },
      codeText(node: any) {
        this.tag(`<code class="${scope}">`)
      },
      codeFenced(node: any) {
        this.tag(`<pre class="${scope}"><code`);
      }
    },
    exit: {
      codeFencedFenceInfo(node: any) {
        const language = this.resume();
        this.tag(` class="${scope} language-${language}" `)
      }
    }
  };
}
