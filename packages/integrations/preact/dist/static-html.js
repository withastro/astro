import { h } from 'preact';
const StaticHtml = ({ value, name, hydrate = true }) => {
	if (!value) return null;
	const tagName = hydrate ? 'astro-slot' : 'astro-static-slot';
	return h(tagName, { name, dangerouslySetInnerHTML: { __html: value } });
};
StaticHtml.shouldComponentUpdate = () => false;
var static_html_default = StaticHtml;
export { static_html_default as default };
