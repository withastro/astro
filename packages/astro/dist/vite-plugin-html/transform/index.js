import MagicString from 'magic-string';
import { rehype } from 'rehype';
import { VFile } from 'vfile';
import escape from './escape.js';
import slots, { SLOT_PREFIX } from './slots.js';
async function transform(code, id) {
	const s = new MagicString(code, { filename: id });
	const parser = rehype().data('settings', { fragment: true }).use(escape, { s }).use(slots, { s });
	const vfile = new VFile({ value: code, path: id });
	await parser.process(vfile);
	s.prepend(`function render({ slots: ${SLOT_PREFIX} }) {
		return \``);
	s.append('`\n	}\nrender["astro:html"] = true;\nexport default render;');
	return {
		code: s.toString(),
		map: s.generateMap({ hires: 'boundary' }),
	};
}
export { transform };
