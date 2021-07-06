import { createComponent } from 'solid-js';

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * As a bonus, we can signal to Preact that this subtree is
 * entirely static and will never change via `shouldComponentUpdate`.
 */
const StaticHtml = ({ innerHTML }) => {
  if (!innerHTML) return null;
  return () => createComponent('astro-fragment', { innerHTML });
};

export default StaticHtml;
