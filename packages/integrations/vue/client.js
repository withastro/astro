import { h, createSSRApp, createApp } from 'vue';
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
		if (client === 'only') {
			const app = createApp({ name, render: () => h(Component, props, slots) });
			await setup(app);
			app.mount(element, false);
		} else {
			const app = createSSRApp({ name, render: () => h(Component, props, slots) });
			await setup(app);
			app.mount(element, true);
		}
	};
