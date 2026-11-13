import type { SSRResult } from '../../../types.js';
import { renderUniqueStylesheet } from './tags.js';
import { renderElement } from './util.js';

export function collectComponentAssets(result: SSRResult, moduleId: string | undefined): string {
	const assets = moduleId && result.componentMetadata.get(moduleId)?.assets;
	if (!assets) return '';
	const { emitted } = (result._metadata.componentAssets ??= { emitted: new Set() });
	let head = '';
	for (const style of assets.styles) {
		const key = style.type === 'external' ? `link:${style.src}` : `style:${style.content}`;
		if (emitted.has(key)) continue;
		emitted.add(key);
		head += renderUniqueStylesheet(result, style);
	}
	for (const script of assets.scripts) {
		const key = `script:${script.props.src ?? script.children}`;
		if (emitted.has(key)) continue;
		emitted.add(key);
		head += renderElement('script', script, false);
	}
	return head;
}
