import { SSRResult } from '../../../@types/astro';
import { markHTMLString } from '../escape.js';
import { renderElement } from './util.js';

const stylesheetRel = 'stylesheet';

export function renderStylesheet({ href }: { href: string }) {
	return markHTMLString(
		renderElement(
			'link',
			{
				props: {
					rel: stylesheetRel,
					href,
				},
				children: '',
			},
			false
		)
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
