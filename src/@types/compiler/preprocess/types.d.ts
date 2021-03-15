import { Location } from 'locate-character';
export interface Source {
    source: string;
    get_location: (search: number) => Location;
    file_basename: string;
    filename: string;
}
export interface Processed {
    code: string;
    map?: string | object;
    dependencies?: string[];
    toString?: () => string;
}
export declare type MarkupPreprocessor = (options: {
    content: string;
    filename: string;
}) => Processed | Promise<Processed>;
export declare type Preprocessor = (options: {
    content: string;
    attributes: Record<string, string | boolean>;
    filename?: string;
}) => Processed | Promise<Processed>;
export interface PreprocessorGroup {
    markup?: MarkupPreprocessor;
    style?: Preprocessor;
    script?: Preprocessor;
}
