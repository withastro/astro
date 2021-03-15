import { DecodedSourceMap, RawSourceMap } from '@ampproject/remapping/dist/types/types';
import { SourceMap } from 'magic-string';
import { Source, Processed } from '../preprocess/types';
export declare type SourceLocation = {
    line: number;
    column: number;
};
export declare function sourcemap_add_offset(map: DecodedSourceMap, offset: SourceLocation, source_index: number): void;
export declare class MappedCode {
    string: string;
    map: DecodedSourceMap;
    constructor(string?: string, map?: DecodedSourceMap);
    /**
     * concat in-place (mutable), return this (chainable)
     * will also mutate the `other` object
     */
    concat(other: MappedCode): MappedCode;
    static from_processed(string: string, map?: DecodedSourceMap): MappedCode;
    static from_source({ source, file_basename, get_location }: Source): MappedCode;
}
export declare function combine_sourcemaps(filename: string, sourcemap_list: Array<DecodedSourceMap | RawSourceMap>): RawSourceMap;
export declare function apply_preprocessor_sourcemap(filename: string, svelte_map: SourceMap, preprocessor_map_input: string | DecodedSourceMap | RawSourceMap): SourceMap;
export declare function parse_attached_sourcemap(processed: Processed, tag_name: 'script' | 'style'): void;
