import type { Element } from 'hast';
import MagicString from 'magic-string';

const splitAttrsTokenizer = /([\$\{\}\@a-z0-9_\:\-]*)\s*?=\s*?(['"]?)(.*?)\2\s+/gim;

export function replaceAttribute(s: MagicString, node: Element, key: string, newValue: string) {
	splitAttrsTokenizer.lastIndex = 0;
	const text = s.original
		.slice(node.position?.start.offset ?? 0, node.position?.end.offset ?? 0)
		.toString();
	const offset = text.indexOf(key);
	if (offset === -1) return;
	const start = node.position!.start.offset! + offset;
	const tokens = text.slice(offset).split(splitAttrsTokenizer);
	const token = tokens[0].replace(/([^>])(\>[\s\S]*$)/gim, '$1');
	if (token.trim() === key) {
		const end = start + key.length;
		s.overwrite(start, end, newValue);
	} else {
		const end = start + `${key}=${tokens[2]}${tokens[3]}${tokens[2]}`.length;
		s.overwrite(start, end, newValue);
	}
}
export function needsEscape(value: any): value is string {
	return typeof value === 'string' && (value.includes('`') || value.includes('${'));
}
export function escape(value: string) {
	return value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}
