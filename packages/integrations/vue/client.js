import { h, Teleport, defineComponent } from 'vue';
import StaticHtml from './static-html.js';

export default (element) =>
	(Component, props, slotted) => {
		delete props['class'];
		if (!element.hasAttribute('ssr')) return;

		// Expose name on host component for Vue devtools
		const name = Component.name ? `${Component.name} Host` : undefined;
		const slots = {};
		const { addChild } = globalThis['@astrojs/vue']
		for (const [key, value] of Object.entries(slotted)) {
			slots[key] = () => h(StaticHtml, { value, name: key === 'default' ? undefined : key });
		}
		// h(Teleport, { to: element }, ["AHHHHHH"])
		let host = defineComponent({
			name,
			setup() { 
				return () => h(Component, props, slots)
			}
		});
		addChild(host)
	};
