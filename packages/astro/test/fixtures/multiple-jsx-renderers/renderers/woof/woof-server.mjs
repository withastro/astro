// @ts-check
import { createFilter } from '@astrojs/internal-helpers/create-filter';
import opts from 'astro:woof:opts';

const filter = (opts.include || opts.exclude) ? createFilter(opts.include, opts.exclude) : null;

/** @type {import('astro').NamedSSRLoadedRendererValue} */
const renderer = {
  name: 'woof',

  async check(Component, _props, _slots, metadata) {
    if (typeof Component !== 'function') return false;
    if (filter && metadata?.componentUrl && !filter(metadata.componentUrl)) {
      return false;
    }
    return true;
  },

  async renderToStaticMarkup(Component, props) {
    const html = Component(props);
    return Promise.resolve({
      html: `<div data-renderer="woof">${html}</div>`,
    });
  },

  supportsAstroStaticSlot: true,
};

export default renderer;
