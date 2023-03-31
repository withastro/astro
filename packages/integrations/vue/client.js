import { h, createSSRApp, createApp, Suspense } from 'vue';
import { setup } from 'virtual:@astrojs/vue/app';
import StaticHtml from './static-html.js';

export default (element) =>
	async (Component, props, slotted, { client }) => {
		delete props['class'];
		if (!element.hasAttribute('ssr')) return;

		// Expose name on host component for Vue devtools
		const name = Component.name ? `${Component.name} Host` : undefined;
		const slots = {};
		for (const [key, value] of Object.entries(slotted)) {
			slots[key] = () => h(StaticHtml, { value, name: key === 'default' ? undefined : key });
		}

		let content = h(Component, props, slots);
		// related to https://github.com/withastro/astro/issues/6549
		// if the component is async, wrap it in a Suspense component
		if (isAsync(Component.setup)) {
			content = h(Suspense, null, content);
		}

		if (client === 'only') {
			const app = createApp({ name, render: () => content });
			await setup(app);
			app.mount(element, false);
		} else {
			const app = createSSRApp({ name, render: () => content });
			await setup(app);
			app.mount(element, true);
		}
	};

function isAsync(fn) {
	const constructor = fn?.constructor;
	return constructor && constructor.name === 'AsyncFunction';
}
