import { ModuleInfo, PartialResolvedId } from 'rollup';
import { TransformResult } from './transformRequest';
export declare class ModuleNode {
    /**
     * Public served url path, starts with /
     */
    url: string;
    /**
     * Resolved file system path + query
     */
    id: string | null;
    file: string | null;
    type: 'js' | 'css';
    info?: ModuleInfo;
    meta?: Record<string, any>;
    importers: Set<ModuleNode>;
    importedModules: Set<ModuleNode>;
    acceptedHmrDeps: Set<ModuleNode>;
    isSelfAccepting: boolean;
    transformResult: TransformResult | null;
    ssrTransformResult: TransformResult | null;
    ssrModule: Record<string, any> | null;
    lastHMRTimestamp: number;
    constructor(url: string);
}
export declare type ResolvedUrl = [
    url: string,
    resolvedId: string,
    meta: object | null | undefined
];
export declare class ModuleGraph {
    private resolveId;
    urlToModuleMap: Map<string, ModuleNode>;
    idToModuleMap: Map<string, ModuleNode>;
    fileToModulesMap: Map<string, Set<ModuleNode>>;
    safeModulesPath: Set<string>;
    constructor(resolveId: (url: string) => Promise<PartialResolvedId | null>);
    getModuleByUrl(rawUrl: string): Promise<ModuleNode | undefined>;
    getModuleById(id: string): ModuleNode | undefined;
    getModulesByFile(file: string): Set<ModuleNode> | undefined;
    onFileChange(file: string): void;
    invalidateModule(mod: ModuleNode, seen?: Set<ModuleNode>): void;
    invalidateAll(): void;
    /**
     * Update the module graph based on a module's updated imports information
     * If there are dependencies that no longer have any importers, they are
     * returned as a Set.
     */
    updateModuleInfo(mod: ModuleNode, importedModules: Set<string | ModuleNode>, acceptedModules: Set<string | ModuleNode>, isSelfAccepting: boolean): Promise<Set<ModuleNode> | undefined>;
    ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode>;
    createFileOnlyEntry(file: string): ModuleNode;
    resolveUrl(url: string): Promise<ResolvedUrl>;
}
