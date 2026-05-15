import { createElement as h, memo } from 'react';
const StaticHtml = ({ value, name, hydrate = true }) => {
	if (value == null || value.trim() === '') return null;
	const tagName = hydrate ? 'astro-slot' : 'astro-static-slot';
	return h(tagName, {
		name,
		suppressHydrationWarning: true,
		dangerouslySetInnerHTML: { __html: value },
	});
};
var static_html_default = memo(StaticHtml, () => true);
export { static_html_default as default };
