/** Utilities used in deployment-ready SSR bundles */
import Slugger from 'github-slugger';

const slugger = new Slugger();
/** @see {@link "/packages/astro/vite-plugin-markdown"} */
export function slug(value: string): string {
	return slugger.slug(value);
}