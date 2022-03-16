# CSS Plugin

When looking through [the different plugins](./intro.md), you might notice that the CSS plugin seems weirdly complicated compared to the HTML or Astro one. After all, CSS is pretty simple right? Get the CSS, get completions (or other features) for it, send them back and we're done, right? Unfortunately, it's not that easy due to the nature of where you can find CSS in an `.astro` file.

Unlike HTML (which is everything that is under the frontmatter) and Astro (which is the entire file) or even TypeScript (which is the entire file, but converted to TSX first), CSS can find itself in multiple places at the same time, such as in multiple `<style>` tags but also in inline `style` tags in all kinds of elements. Because of that, we can't simply put a `css` field on our AstroDocuments, pass that to the CSSPlugin like we do for HTML and call it a day.

Instead, what we do is keep a list of style elements in our `AstroDocument`. Much like the HTML plugin, the CSS plugin cannot operate on simple strings, it instead ask for a TextDocument to be supplied so we also eventually create `CSSDocument`s for those style elements for the CSS plugin to operate on

For the full code of this plugin, [see the css folder in plugins](/packages/language-server/src/plugins/css/)
