import type * as unifont from 'unifont';
import { sortObjectByKey } from '../utils.js';

function computeIdFromSource(source: unifont.LocalFontSource | unifont.RemoteFontSource): string {
	return 'name' in source ? source.name : source.url;
}

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

		const ids = new Set(existing.src.map((source) => computeIdFromSource(source)));

		existing.src.push(
			...font.src.filter((source) => {
				const id = computeIdFromSource(source);
				return !ids.has(id) && ids.add(id);
			}),
		);
	}
	return result;
}
