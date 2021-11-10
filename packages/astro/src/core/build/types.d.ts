import type { ComponentPreload } from '../ssr/index';
import type { RouteData } from '../../@types/astro-core';

export interface PageBuildData {
  paths: string[];
  preload: ComponentPreload;
  route: RouteData;
}
export type AllPagesData = Record<string, PageBuildData>;

