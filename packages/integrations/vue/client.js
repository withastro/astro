import { h, createSSRApp, createApp } from 'vue';
import StaticHtml from './static-html.js';

export default (element) => (Component, props, children, { client }) => {
	delete props['class'];
	if (!element.hasAttribute('ssr')) return;

	// Expose name on host component for Vue devtools
	const name = Component.name ? `${Component.name} Host` : undefined;
	const slots = {};
	if (children != null) {
		slots.default = () => h(StaticHtml, { value: children });
	}
	if (client === 'only') {
		const app = createApp({ name, render: () => h(Component, props, slots) });
		app.mount(element, false);
	} else {
		const app = createSSRApp({ name, render: () => h(Component, props, slots) });
		app.mount(element, true);
	}
};
