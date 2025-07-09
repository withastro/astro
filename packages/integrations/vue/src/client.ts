import { setup } from 'virtual:@astrojs/vue/app';
import { createApp, createSSRApp, h, Suspense } from 'vue';
import StaticHtml from './static-html.js';

// keep track of already initialized apps, so we don't hydrate again for view transitions
let appMap = new WeakMap<
	HTMLElement,
	{ props: Record<string, any>; slots: Record<string, any>; component?: any }
>();

export default (element: HTMLElement) =>
	async (
		Component: any,
		props: Record<string, any>,
		slotted: Record<string, any>,
		{ client }: Record<string, string>,
	) => {
		if (!element.hasAttribute('ssr')) return;

		// Expose name on host component for Vue devtools
		const name = Component.name ? `${Component.name} Host` : undefined;
		const slots: Record<string, any> = {};
		for (const [key, value] of Object.entries(slotted)) {
			slots[key] = () => h(StaticHtml, { value, name: key === 'default' ? undefined : key });
		}

		const isHydrate = client !== 'only';
		const bootstrap = isHydrate ? createSSRApp : createApp;

		// keep a reference to the app, props and slots so we can update a running instance later
		let appInstance = appMap.get(element);

		if (!appInstance) {
			appInstance = {
				props,
				slots,
			};
			const app = bootstrap({
				name,
				render() {
					// At this point, appInstance has been set so it's safe to use a non-null assertion
					let content = h(Component, appInstance!.props, appInstance!.slots);
					appInstance!.component = this;
					// related to https://github.com/withastro/astro/issues/6549
					// if the component is async, wrap it in a Suspense component
					if (isAsync(Component.setup)) {
						content = h(Suspense, null, content);
					}
					return content;
				},
			});
			app.config.idPrefix = element.getAttribute('prefix') ?? undefined;
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

function isAsync(fn: () => any) {
	const constructor = fn?.constructor;
	return constructor && constructor.name === 'AsyncFunction';
}
