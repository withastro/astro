import { createElement } from 'react';

const Html = ({ value }) => value ? createElement('div', { 'data-astro-children': '', dangerouslySetInnerHTML: { __html: value }}) : null;
Html.shouldComponentUpdate = () => false;
export default Html;
