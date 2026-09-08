import MagicString from 'magic-string';
import { collectSlots, SLOT_PREFIX } from './slots.js';
import { escapeTemplateLiteralCharacters, needsEscape } from './utils.js';

export async function transform(code: string, id: string) {
	const s = new MagicString(code, { filename: id });

	// Slots become real `${...}` expressions; everything else becomes static
	// template literal text and has its meaningful characters escaped.
	let cursor = 0;
	for (const slot of collectSlots(code)) {
		escapeRange(s, code, cursor, slot.start);
		s.overwrite(slot.start, slot.end, slot.value);
		cursor = slot.end;
	}
	escapeRange(s, code, cursor, code.length);

	s.prepend(`function render({ slots: ${SLOT_PREFIX} }) {\n\t\treturn \``);
	s.append('`\n\t}\nrender["astro:html"] = true;\nexport default render;');

	return {
		code: s.toString(),
		map: s.generateMap({ hires: 'boundary' }),
	};
}

function escapeRange(s: MagicString, code: string, start: number, end: number) {
	if (start >= end) return;
	const segment = code.slice(start, end);
	if (needsEscape(segment)) {
		s.overwrite(start, end, escapeTemplateLiteralCharacters(segment));
	}
}
