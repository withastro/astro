import type { TextStyler } from '../../definitions.js';
import type { DebugInfoFormatter } from '../definitions.js';

const MAX_PADDING = 25;

interface Options {
	textStyler: TextStyler;
}

export function createStyledDebugInfoFormatter({ textStyler }: Options): DebugInfoFormatter {
	return {
		format(info) {
			let output = '';
			for (const [label, value] of info) {
				const padding = MAX_PADDING - label.length;
				const [first, ...rest] = Array.isArray(value) ? value : [value];
				let richtext = `${textStyler.bold(label)}${' '.repeat(padding)}${textStyler.green(first)}`;
				if (rest.length > 0) {
					for (const entry of rest) {
						richtext += `\n${' '.repeat(MAX_PADDING)}${textStyler.green(entry)}`;
					}
				}
				output += richtext;
			}

			return output.trim();
		},
	};
}
