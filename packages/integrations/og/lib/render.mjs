import { transform, walkSync, ELEMENT_NODE } from "ultrahtml";
import inline from 'ultrahtml/transformers/inline';
import sanitize from 'ultrahtml/transformers/sanitize';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-wasm';
import init from './assets/index.mjs';
import { shorthash } from "./shorthash.mjs";

function fixup() {
  return async function (doc) {
    walkSync(doc, (node, parent) => {
      if (node.type === ELEMENT_NODE && node.name === 'div' && !node.attributes.style?.includes('display:flex')) {
        node.attributes.style = node.attributes.style ?? '';
        node.attributes.style += 'display:flex;flex-direction:column;';
      }
    });
    return doc;
  };
}

async function preprocess(markup) {
  return await transform(markup, [inline(), sanitize(), fixup()]);
}

const cache = globalThis.astroOG.cache;
let fonts = [];
export async function render(markup, userConfig) {
  if (fonts.length === 0) ({ fonts } = await init());
  const config = { debug: false, width: 1200, height: 630, fonts: [], ...userConfig };
  config.fonts.push(...fonts);
  const hash = shorthash(markup + JSON.stringify(config));
  if (cache.has(hash)) return cache.get(hash);

  const name = globalThis.astroOG.addStaticImage(hash, async () => {
    const code = await preprocess(markup);
    const svg = await satori(typeof code === 'string' ? html(code) : code, config)
    // const image = new Resvg(svg, { fitTo: { mode: 'width', value: config.width } })
    // const chunk = image.render().asPng()
    return svg;
  });
  cache.set(hash, name);

  return name;
}
