import MagicString from 'magic-string';
import { rehype } from 'rehype';
import { VFile } from 'vfile';
import escape from './escape.js';
import slots, { SLOT_PREFIX } from './slots.js';

export async function transform(code: string, id: string) {
	const s = new MagicString(code, { filename: id });
	const imports = new Map();
	const parser = rehype().data('settings', { fragment: true }).use(escape, { s }).use(slots, { s });

	const vfile = new VFile({ value: code, path: id });
	await parser.process(vfile);
	s.prepend(
		`export default {\n\t"astro:html": true,\n\trender({ slots: ${SLOT_PREFIX} }) {\n\t\treturn \``
	);
	s.append('`\n\t}\n}');

	if (imports.size > 0) {
		let importText = '';
		for (const [path, importName] of imports.entries()) {
			importText += `import ${importName} from "${path}";\n`;
		}
		s.prepend(importText);
	}

	return {
		code: s.toString(),
		map: s.generateMap(),
	};
}
