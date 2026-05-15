import { setup } from 'virtual:astro:vue-app';
import { createApp, createSSRApp, h, Suspense } from 'vue';
import StaticHtml from './static-html.js';
let appMap = /* @__PURE__ */ new WeakMap();
var client_default =
	(element) =>
	async (Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;
		const name = Component.name ? `${Component.name} Host` : void 0;
		const slots = {};
		for (const [key, value] of Object.entries(slotted)) {
			slots[key] = () => h(StaticHtml, { value, name: key === 'default' ? void 0 : key });
		}
		const isHydrate = client !== 'only';
		const bootstrap = isHydrate ? createSSRApp : createApp;
		let appInstance = appMap.get(element);
		if (!appInstance) {
			appInstance = {
				props,
				slots,
			};
			const app = bootstrap({
				name,
				render() {
					let content = h(Component, appInstance.props, appInstance.slots);
					appInstance.component = this;
					if (isAsync(Component.setup)) {
						content = h(Suspense, null, content);
					}
					return content;
				},
			});
			app.config.idPrefix = element.getAttribute('prefix') ?? void 0;
			await setup(app);
			app.mount(element, isHydrate);
			appMap.set(element, appInstance);
			element.addEventListener('astro:unmount', () => app.unmount(), { once: true });
		} else {
			appInstance.props = props;
			appInstance.slots = slots;
			appInstance.component.$forceUpdate();
		}
	};
function isAsync(fn) {
	const constructor = fn?.constructor;
	return constructor && constructor.name === 'AsyncFunction';
}
export { client_default as default };
