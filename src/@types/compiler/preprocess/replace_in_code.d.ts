import { MappedCode } from '../utils/mapped_code';
import { Source } from './types';
export declare function slice_source(code_slice: string, offset: number, { file_basename, filename, get_location }: Source): Source;
export declare function replace_in_code(regex: RegExp, get_replacement: (...match: any[]) => Promise<MappedCode>, location: Source): Promise<MappedCode>;
