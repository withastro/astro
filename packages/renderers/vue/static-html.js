import { h } from 'vue';

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * This is the Vue + JSX equivalent of using `<div v-html="value" />`
 */
const StaticHtml = ({ value }) => value ? h('div', { 'data-astro-children': '', innerHTML: value }) : null;

/** 
  * Other frameworks have `shouldComponentUpdate` in order to signal
  * that this subtree is entirely static and will not be updated
  * 
  * Fortunately, Vue is smart enough to figure that out without any
  * help from us, so this just works out of the box!
  */

export default StaticHtml;
