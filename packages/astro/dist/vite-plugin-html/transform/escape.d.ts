import type { Root } from 'hast';
import type MagicString from 'magic-string';
import type { Plugin } from 'unified';
declare const rehypeEscape: Plugin<
	[
		{
			s: MagicString;
		},
	],
	Root
>;
export default rehypeEscape;
