import { defineComponent, h } from 'vue';

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * This is the Vue + JSX equivalent of using `<div v-html="value" />`
 */
const StaticHtml = defineComponent({
	props: {
		value: String,
		name: String,
		hydrate: {
			type: Boolean,
			default: true,
		},
	},
	setup({ name, value, hydrate }) {
		if (!value) return () => null;
		let tagName = hydrate ? 'astro-slot' : 'astro-static-slot';
		// Astro passes slots as `SlotString` objects (a `String` subclass). Vue's SSR buffer
		// treats non-primitive items as nested buffers and concatenates them char by char,
		// so `innerHTML` must be a primitive string. See https://github.com/withastro/astro/issues/18392
		const html = String(value);
		return () => h(tagName, { name, innerHTML: html });
	},
});

/**
 * Other frameworks have `shouldComponentUpdate` in order to signal
 * that this subtree is entirely static and will not be updated
 *
 * Fortunately, Vue is smart enough to figure that out without any
 * help from us, so this just works out of the box!
 */

export default StaticHtml;
