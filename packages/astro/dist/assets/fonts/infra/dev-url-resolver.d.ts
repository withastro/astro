import type { UrlResolver } from '../definitions.js';
export declare class DevUrlResolver implements UrlResolver {
	#private;
	constructor({ base, searchParams }: { base: string; searchParams: URLSearchParams });
	resolve(id: string): string;
	get cspResources(): Array<string>;
	get urls(): Array<string>;
}
