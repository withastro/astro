import type { Root } from 'hast';
import type MagicString from 'magic-string';
import type { Plugin } from 'unified';
declare const rehypeSlots: Plugin<
	[
		{
			s: MagicString;
		},
	],
	Root
>;
export default rehypeSlots;
export declare const SLOT_PREFIX = '___SLOTS___';
