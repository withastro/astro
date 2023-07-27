import type { SSRElement, SSRResult } from '../../../@types/astro';
import type { StylesheetAsset } from '../../../core/app/types';
import { renderElement } from './util.js';

export function renderScriptElement({ props, children }: SSRElement) {
	return renderElement('script', {
		props,
		children,
	});
}

export function renderUniqueScriptElement(result: SSRResult, { props, children }: SSRElement) {
	if (
		Array.from(result.scripts).some((s) => {
			if (s.props.type === props.type && s.props.src === props.src) {
				return true;
			}
			if (!props.src && s.children === children) return true;
		})
	)
		return '';
	const key = `script-${props.type}-${props.src}-${children}`;
	if (checkOrAddContentKey(result, key)) return '';
	return renderScriptElement({ props, children });
}

export function renderUniqueStylesheet(result: SSRResult, sheet: StylesheetAsset) {
	if (sheet.type === 'external') {
		if (Array.from(result.styles).some((s) => s.props.href === sheet.src)) return '';
		const key = 'link-external-' + sheet.src;
		if (checkOrAddContentKey(result, key)) return '';
		return renderElement('link', {
			props: {
				rel: 'stylesheet',
				href: sheet.src,
			},
			children: '',
		});
	}

	if (sheet.type === 'inline') {
		if (Array.from(result.styles).some((s) => s.children.includes(sheet.content))) return '';
		const key = `link-inline-` + sheet.content;
		if (checkOrAddContentKey(result, key)) return '';
		return renderElement('style', { props: { type: 'text/css' }, children: sheet.content });
	}
}

function checkOrAddContentKey(result: SSRResult, key: string): boolean {
	if (result._metadata.contentKeys.has(key)) return true;
	result._metadata.contentKeys.add(key);
	return false;
}
