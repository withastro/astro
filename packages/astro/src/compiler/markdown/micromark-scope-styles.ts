import type { MicromarkExtension } from '../../@types/micromark';

/** See https://github.com/micromark/micromark/blob/14d86e04df9c1510dad544cb835e6df85b899107/lib/compile/html.mjs */
export function createMicromarkScopeStyles(scope: string): MicromarkExtension {
  return {
    enter: {
      paragraph() {
        this.tag(`<p class="${scope}">`);
      },
      blockquote() {
        this.tag(`<blockquote class="${scope}">`)
      },
      listItemMarker() {
        this.tag(`<li class="${scope}">`)
      },
      listOrdered() {
        this.tag(`<ol class="${scope}">`)
      },
      listUnordered() {
        this.tag(`<ul class="${scope}">`)
      },
      emphasis() {
        this.tag(`<em class="${scope}">`);
      },
      strong() {
        this.tag(`<strong class="${scope}">`);
      },
      codeText() {
        this.tag(`<code class="${scope}">`)
      },
      codeFenced() {
        this.tag(`<pre class="${scope}"><code`);
      },
    },
    exit: {
      thematicBreak() {
        this.tag(`<hr class="${scope}" />`);
      },
      codeFencedFenceInfo() {
        const language = this.resume();
        this.tag(` class="${scope} language-${language}" `)
      }
    }
  };
}
