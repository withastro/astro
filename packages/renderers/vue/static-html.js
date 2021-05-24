import { h } from 'vue';

const StaticHtml = ({ value }) => value ? h('div', { 'data-astro-children': '', innerHTML: value }) : null;
export default StaticHtml;
