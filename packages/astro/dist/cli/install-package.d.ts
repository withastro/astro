import type { AstroLogger } from '../core/logger/core.js';
type GetPackageOptions = {
	skipAsk?: boolean;
	optional?: boolean;
	cwd?: string;
};
export declare function getPackage<T>(
	packageName: string,
	logger: AstroLogger,
	options: GetPackageOptions,
	otherDeps?: string[],
): Promise<T | undefined>;
export declare function fetchPackageJson(
	scope: string | undefined,
	name: string,
	tag: string,
): Promise<Record<string, any> | Error>;
export declare function fetchPackageVersions(packageName: string): Promise<string[] | Error>;
export {};
