import { renderElement } from './util.js';
function renderScriptElement({ props, children }) {
	return renderElement('script', {
		props,
		children,
	});
}
function renderUniqueStylesheet(result, sheet) {
	if (sheet.type === 'external') {
		if (Array.from(result.styles).some((s) => s.props.href === sheet.src)) return '';
		return renderElement('link', { props: { rel: 'stylesheet', href: sheet.src }, children: '' });
	}
	if (sheet.type === 'inline') {
		if (Array.from(result.styles).some((s) => s.children.includes(sheet.content))) return '';
		return renderElement('style', { props: {}, children: sheet.content });
	}
}
export { renderScriptElement, renderUniqueStylesheet };
