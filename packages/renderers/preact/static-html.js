import { h } from 'preact';

const StaticHtml = ({ value }) => value ? h('div', { 'data-astro-children': '', dangerouslySetInnerHTML: { __html: value }}) : null;
StaticHtml.shouldComponentUpdate = () => false;
export default StaticHtml;
