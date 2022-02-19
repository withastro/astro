import type { ComponentPreload } from '../render/dev/index';
import type { RouteData } from '../../@types/astro';

export interface PageBuildData {
	paths: string[];
	preload: ComponentPreload;
	route: RouteData;
}
export type AllPagesData = Record<string, PageBuildData>;
