import type * as prettier from 'prettier';
type PackageVersion = {
	full: string;
	major: number;
	minor: number;
	patch: number;
};
export declare function setIsTrusted(_isTrusted: boolean): void;
export type PackageInfo = {
	entrypoint: string;
	directory: string;
	version: PackageVersion;
};
/**
 * Get the path of a package's directory from the paths in `fromPath`, if `root` is set to false, it will return the path of the package's entry point
 */
export declare function getPackageInfo(
	packageName: string,
	fromPath: string[],
): PackageInfo | undefined;
type SvelteIntegration = {
	toTSX(code: string, className: string): string;
};
type VueIntegration = {
	toTSX(code: string, className: string): string;
};
export declare function importSvelteIntegration(fromPath: string): SvelteIntegration | undefined;
export declare function importVueIntegration(fromPath: string): VueIntegration | undefined;
export declare function importPrettier(fromPath: string): typeof prettier | undefined;
export declare function getPrettierPluginPath(fromPath: string): string | undefined;
export declare function getWorkspacePnpPath(workspacePath: string): string | null;
export declare function parsePackageVersion(version: string): PackageVersion;
export {};
