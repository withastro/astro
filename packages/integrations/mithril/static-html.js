import m from 'mithril'

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 */
const StaticHtml = {
  view: ({ attrs: { name, value }}) => {
    if (!value) return null;
    return m('astro-slot', { name }, m.trust(value));
  }
};

export default StaticHtml;
