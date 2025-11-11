import type * as unifont from 'unifont';
import { sortObjectByKey } from '../utils.js';

export function dedupeFontFaces(
	current: Array<unifont.FontFaceData>,
	incoming: Array<unifont.FontFaceData>,
): Array<unifont.FontFaceData> {
	const result: Array<unifont.FontFaceData> = [...current];
	for (const font of incoming) {
		const existing = result.find(({ src: _src, ...rest }) => {
			const a = JSON.stringify(sortObjectByKey(rest));
			const { src: __src, ..._rest } = font;
			const b = JSON.stringify(sortObjectByKey(_rest));
			return a === b;
		});

		if (!existing) {
			result.push(font);
			continue;
		}

		const ids = new Set<string>();

		existing.src = [...existing.src, ...font.src].filter((source) => {
			const id = 'name' in source ? source.name : source.url;
			return !ids.has(id) && ids.add(id);
		});

		result.push(font);
	}
	return result;
}
