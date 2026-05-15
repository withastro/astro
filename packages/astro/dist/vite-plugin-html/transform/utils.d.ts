import type { Element } from 'hast';
import type MagicString from 'magic-string';
export declare function replaceAttribute(
	s: MagicString,
	node: Element,
	key: string,
	newValue: string,
): MagicString | undefined;
export declare function needsEscape(value: any): value is string;
export declare function escapeTemplateLiteralCharacters(value: string): string;
