import type { VirtualCode } from '@volar/language-core';
import type { YAMLError } from 'yaml';
export declare const VIRTUAL_CODE_ID = 'frontmatter-ts';
export type YAML2TSResult = {
	errors: YAMLError[];
	virtualCode: VirtualCode;
};
export declare function yaml2ts(frontmatter: string, collection: string): YAML2TSResult;
