import { setup } from 'virtual:@astrojs/vue/app';
import { Suspense, createApp, createSSRApp, h } from 'vue';
import StaticHtml from './static-html.js';

export default (element) =>
	async (Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;

		// Expose name on host component for Vue devtools
		const name = Component.name ? `${Component.name} Host` : undefined;
		const slots = {};
		for (const [key, value] of Object.entries(slotted)) {
			slots[key] = () => h(StaticHtml, { value, name: key === 'default' ? undefined : key });
		}

		const isHydrate = client !== 'only';
		const bootstrap = isHydrate ? createSSRApp : createApp;
		const app = bootstrap({
			name,
			render() {
				let content = h(Component, props, slots);
				// related to https://github.com/withastro/astro/issues/6549
				// if the component is async, wrap it in a Suspense component
				if (isAsync(Component.setup)) {
					content = h(Suspense, null, content);
				}
				return content;
			},
		});
		await setup(app);
		app.mount(element, isHydrate);

		element.addEventListener('astro:unmount', () => app.unmount(), { once: true });
	};

function isAsync(fn) {
	const constructor = fn?.constructor;
	return constructor && constructor.name === 'AsyncFunction';
}
