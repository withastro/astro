import { ResolvedConfig } from '../config';
import { Plugin } from '../plugin';
export declare function resolvePlugins(config: ResolvedConfig, prePlugins: Plugin[], normalPlugins: Plugin[], postPlugins: Plugin[]): Promise<Plugin[]>;
