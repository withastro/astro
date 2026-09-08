import { ELEMENT_NODE, parse, walkSync } from 'ultrahtml';
import { escapeTemplateLiteralCharacters } from './utils.js';

export const SLOT_PREFIX = `___SLOTS___`;

export interface SlotReplacement {
	start: number;
	end: number;
	value: string;
}

/**
 * Find every `<slot>` (excluding `is:inline` ones) and describe how to replace it
 * with a `${___SLOTS___[name] ?? `fallback`}` template literal expression.
 */
export function collectSlots(code: string): SlotReplacement[] {
	const slots: SlotReplacement[] = [];

	walkSync(parse(code), (node) => {
		if (node.type !== ELEMENT_NODE || node.name !== 'slot') return;
		if ('is:inline' in node.attributes) return;

		const [open, close] = node.loc;
		if (!close) return; // Unclosed slot, leave the markup untouched

		const name = node.attributes.name ?? 'default';
		// Empty slots fall back to rendering the slot tag itself
		const fallback =
			open.end < close.start
				? code.slice(open.end, close.start)
				: code.slice(open.start, close.end);

		slots.push({
			start: open.start,
			end: close.end,
			value: `\${${SLOT_PREFIX}["${name}"] ?? \`${escapeTemplateLiteralCharacters(fallback).trim()}\`}`,
		});
	});

	return slots;
}
