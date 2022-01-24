import { ResolvedConfig } from '..';
import { Plugin } from '../plugin';
export declare type Manifest = Record<string, ManifestChunk>;
export interface ManifestChunk {
    src?: string;
    file: string;
    css?: string[];
    assets?: string[];
    isEntry?: boolean;
    isDynamicEntry?: boolean;
    imports?: string[];
    dynamicImports?: string[];
}
export declare function manifestPlugin(config: ResolvedConfig): Plugin;
