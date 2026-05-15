/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * This is the Vue + JSX equivalent of using `<div v-html="value" />`
 */
declare const StaticHtml: import('vue').DefineComponent<
	import('vue').ExtractPropTypes<{
		value: StringConstructor;
		name: StringConstructor;
		hydrate: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>,
	| (() => null)
	| (() => import('vue').VNode<
			import('vue').RendererNode,
			import('vue').RendererElement,
			{
				[key: string]: any;
			}
	  >),
	{},
	{},
	{},
	import('vue').ComponentOptionsMixin,
	import('vue').ComponentOptionsMixin,
	{},
	string,
	import('vue').PublicProps,
	Readonly<
		import('vue').ExtractPropTypes<{
			value: StringConstructor;
			name: StringConstructor;
			hydrate: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>
	> &
		Readonly<{}>,
	{
		hydrate: boolean;
	},
	{},
	{},
	{},
	string,
	import('vue').ComponentProvideOptions,
	true,
	{},
	any
>;
/**
 * Other frameworks have `shouldComponentUpdate` in order to signal
 * that this subtree is entirely static and will not be updated
 *
 * Fortunately, Vue is smart enough to figure that out without any
 * help from us, so this just works out of the box!
 */
export default StaticHtml;
