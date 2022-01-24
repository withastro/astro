import { Logger } from '../logger';
interface SourceMapLike {
    sources: string[];
    sourcesContent?: (string | null)[];
    sourceRoot?: string;
}
export declare function injectSourcesContent(map: SourceMapLike, file: string, logger: Logger): Promise<void>;
export {};
