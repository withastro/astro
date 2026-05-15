export interface Integration {
	name: string;
	title: string;
	description: string;
	image?: string;
	categories: string[];
	repoUrl: string;
	npmUrl: string;
	homepageUrl: string;
	official: boolean;
	featured: number;
	downloads: number;
}
declare const _default: {
	id: string;
	name: string;
	icon: 'astro:logo';
	init(
		canvas: ShadowRoot,
		eventTarget: import('../helpers.js').ToolbarAppEventTarget,
	): Promise<void>;
};
export default _default;
