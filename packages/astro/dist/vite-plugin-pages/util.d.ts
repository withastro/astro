/**
 * Prevents Rollup from triggering other plugins in the process by masking the extension (hence the virtual file).
 * Inverse function of getComponentFromVirtualModulePageName() below.
 * @param virtualModulePrefix The prefix used to create the virtual module
 * @param path Page component path
 */
export declare function getVirtualModulePageName(virtualModulePrefix: string, path: string): string;
export declare function getVirtualModulePageNameForComponent(component: string): string;
