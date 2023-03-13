import type { SSRElement, SSRResult } from '../../../@types/astro';
import { renderElement } from './util.js';

const stylesheetRel = 'stylesheet';

export function renderStyleElement(children: string) {
	return renderElement('style', {
		props: {},
		children,
	});
}

export function renderScriptElement({ props, children }: SSRElement) {
	return renderElement('script', {
		props,
		children,
	});
}

export function renderStylesheet({ href }: { href: string }) {
	return renderElement(
		'link',
		{
			props: {
				rel: stylesheetRel,
				href,
			},
			children: '',
		},
		false
	);
}

export function renderUniqueStylesheet(result: SSRResult, link: { href: string }) {
	for (const existingLink of result.links) {
		if (existingLink.props.rel === stylesheetRel && existingLink.props.href === link.href) {
			return '';
		}
	}

	return renderStylesheet(link);
}
