import type vite from '../core/vite';
import type { AstroConfig } from '../@types/astro-core';

import htmlparser2 from 'htmlparser2';

interface StyleProcessOptions {
  source: string;
  filePath: string;
  config: AstroConfig;
  viteConfig: vite.ResolvedConfig;
}

// https://vitejs.dev/guide/features.html#css-pre-processors
const SUPPORTED_PREPROCESSORS = new Set(['scss', 'sass', 'styl', 'stylus', 'less']);

/** Given HTML, preprocess (Sass, etc.) */
export async function preprocessStyle({ source, filePath, viteConfig }: StyleProcessOptions): Promise<string> {
  // crawl HTML for script tags
  const styles = getStyleTags(source);

  // if no <style> tags, skip
  if (!styles.length) return source;

  let html = source;

  // load vite:css’ transform() hook
  const viteCSSPlugin = viteConfig.plugins.find(({ name }) => name === 'vite:css');
  if (!viteCSSPlugin) throw new Error(`vite:css plugin couldn’t be found`);
  if (!viteCSSPlugin.transform) throw new Error(`vite:css has no transform() hook`);
  const viteCSSTransform = viteCSSPlugin.transform.bind(null as any);

  // tranform styles using vite:css’ transform() step
  styles.reverse(); // start from back, so "start" and "end" still work
  const transformedStyles = await Promise.all(
    styles.map(async (style) => {
      const { start, end, contents, attrs } = style;
      const lang = (attrs.lang || '').toLowerCase(); // don’t be case-sensitive
      if (!SUPPORTED_PREPROCESSORS.has(lang)) return undefined; // only preprocess the above
      const result = await viteCSSTransform(contents, filePath.replace(/\.astro$/, `.${lang}`));
      if (!result) return undefined;
      return {
        start,
        end,
        contents: typeof result === 'string' ? result : result.code,
        attrs,
      };
    })
  );

  // re-insert into HTML
  for (const style of transformedStyles) {
    if (!style) continue;
    const { start, end, contents, attrs } = style;
    delete attrs.lang; // remove lang="*" from output
    html = html.substring(0, start) + `<style${stringAttrs(attrs)}>` + contents + `</style>` + html.substring(end + 1);
  }

  return html;
}

/** Convert attr object to string */
function stringAttrs(attrs: Record<string, string> = {}) {
  let output = '';
  for (const [k, v] of Object.entries(attrs)) {
    if (!v) continue;
    if (typeof v === 'string') {
      output += ` ${k}="${v}"`;
    } else {
      output += ` ${k}`;
    }
  }
  return output;
}

interface StyleTag {
  attrs: Record<string, string>;
  contents: string;
  start: number;
  end: number;
}

/** Parse HTML with htmlparser2 to return <style> tags within .astro (7x faster than cheerio) */
export function getStyleTags(source: string): StyleTag[] {
  let styles: StyleTag[] = [];

  // the HTML doc is read top-to-bottom. these are “buffers” that keep track of in-progress reading until we have a complete <style> tag with contents
  let styleTagOpen = false; // are we inside <style>?
  let styleStart = -1; // char position of <style> open
  let styleAttrs: Record<string, string> = {}; // current <style> attributes
  let styleContents: string[] = []; // collection of <style> contents

  const parser = new htmlparser2.Parser({
    // this detects any time tags were opened. we only want <style>
    onopentag(tagname, attributes) {
      if (tagname === 'style') {
        styleAttrs = attributes;
        styleStart = parser.startIndex;
        styleTagOpen = true;
      }
    },
    // this reads text at all times, but we only want to read contents if a <style> tag has been opened
    // note: this may not grab complete <style> contents within one go, hence the array
    ontext(text) {
      if (styleTagOpen) {
        styleContents.push(text);
      }
    },
    // this detects any time tags were closed; here, when </style> is encountered, take everything stored and save it
    onclosetag(tagname) {
      if (tagname === 'style') {
        // skip empty <style> tags
        if (styleContents.length) {
          styles.push({
            start: styleStart,
            end: parser.endIndex as number,
            attrs: styleAttrs,
            contents: styleContents.join(''),
          });
        }
        // make sure to reset the “buffers” and state (styleAttrs and styleStart will simply be overwritten)
        styleTagOpen = false;
        styleContents = [];
      }
    },
  });
  parser.write(source); // start parsing HTML
  parser.end();

  return styles;
}
