import { ssr } from 'solid-js/web/dist/server.js';

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `astro-fragment` to render that content as VNodes.
 */
const StaticHtml = ({ innerHTML }) => {
  if (!innerHTML) return null;
  return ssr(`<astro-fragment>${innerHTML }</astro-fragment>`);
};

export default StaticHtml;
