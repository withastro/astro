import type { SSRResult } from '../../../types.js';
import { renderUniqueStylesheet } from './tags.js';
import { renderElement } from './util.js';

export function collectComponentAssets(result: SSRResult, moduleId: string | undefined): string {
	const assets = moduleId && result.componentMetadata.get(moduleId)?.assets;
	if (!assets) return '';
	const { emitted } = (result._metadata.componentAssets ??= { emitted: new Set(), pending: [] });
	let head = '';
	const emit = (html: string, order: number) => {
		if (result._metadata.hasRenderedHead) head += html;
		else result._metadata.componentAssets!.pending.push({ order, html });
	};
	for (const style of assets.styles) {
		const key = style.type === 'external' ? `link:${style.src}` : `style:${style.content}`;
		if (emitted.has(key)) continue;
		emitted.add(key);
		const html = renderUniqueStylesheet(result, style);
		if (html) emit(html, style.order);
	}
	for (const script of assets.scripts) {
		const key = `script:${script.props.src ?? script.children}`;
		if (emitted.has(key)) continue;
		emitted.add(key);
		emit(renderElement('script', script, false), assets.order);
	}
	return head;
}
