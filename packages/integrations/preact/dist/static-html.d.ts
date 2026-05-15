type Props = {
	value: string;
	name?: string;
	hydrate?: boolean;
};
/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * As a bonus, we can signal to Preact that this subtree is
 * entirely static and will never change via `shouldComponentUpdate`.
 */
declare const StaticHtml: {
	({ value, name, hydrate }: Props):
		| import('preact').VNode<
				import('preact').Attributes & {
					name: string | undefined;
					dangerouslySetInnerHTML: {
						__html: string;
					};
				}
		  >
		| null;
	shouldComponentUpdate(): boolean;
};
export default StaticHtml;
