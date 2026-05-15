/**
 * Get the virtual module name for a dev CSS import.
 * Usage: `await loader.import(getDevCSSModuleName(routeData.component))`
 */
export declare function getDevCSSModuleName(componentPath: string): string;
/** Get the virtual module name for a dev CSS import from the name of a virtual module for a page. */
export declare function getDevCssModuleNameFromPageVirtualModuleName(
	virtualModulePageName: string,
): string;
