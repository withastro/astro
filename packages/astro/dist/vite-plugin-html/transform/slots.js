import { visit } from 'unist-util-visit';
import { escapeTemplateLiteralCharacters } from './utils.js';
const rehypeSlots = ({ s }) => {
	return (tree, file) => {
		visit(tree, (node) => {
			if (node.type === 'element' && node.tagName === 'slot') {
				if (typeof node.properties?.['is:inline'] !== 'undefined') return;
				const name = node.properties?.['name'] ?? 'default';
				const start = node.position?.start.offset ?? 0;
				const end = node.position?.end.offset ?? 0;
				const first = node.children.at(0) ?? node;
				const last = node.children.at(-1) ?? node;
				const text = file.value
					.slice(first.position?.start.offset ?? 0, last.position?.end.offset ?? 0)
					.toString();
				s.overwrite(
					start,
					end,
					`\${${SLOT_PREFIX}["${name}"] ?? \`${escapeTemplateLiteralCharacters(text).trim()}\`}`,
				);
			}
		});
	};
};
var slots_default = rehypeSlots;
const SLOT_PREFIX = `___SLOTS___`;
export { SLOT_PREFIX, slots_default as default };
