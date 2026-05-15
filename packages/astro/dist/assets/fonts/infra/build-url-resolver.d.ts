import type { AssetsPrefix } from '../../../types/public/index.js';
import type { UrlResolver } from '../definitions.js';
export declare class BuildUrlResolver implements UrlResolver {
	#private;
	constructor({
		base,
		assetsPrefix,
		searchParams,
	}: {
		base: string;
		assetsPrefix: AssetsPrefix;
		searchParams: URLSearchParams;
	});
	resolve(id: string): string;
	get cspResources(): Array<string>;
	get urls(): Array<string>;
}
