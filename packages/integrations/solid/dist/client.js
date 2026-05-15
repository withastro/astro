import { Suspense } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { createComponent, hydrate, render } from 'solid-js/web';
const alreadyInitializedElements = /* @__PURE__ */ new WeakMap();
var client_default =
	(element) =>
	(Component, props, slotted, { client }) => {
		if (!element.hasAttribute('ssr')) return;
		const isHydrate = client !== 'only';
		const bootstrap = isHydrate ? hydrate : render;
		let slot;
		let _slots = {};
		if (Object.keys(slotted).length > 0) {
			if (client !== 'only') {
				const iterator = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, (node) => {
					if (node === element) return NodeFilter.FILTER_SKIP;
					if (node.nodeName === 'ASTRO-SLOT') return NodeFilter.FILTER_ACCEPT;
					if (node.nodeName === 'ASTRO-ISLAND') return NodeFilter.FILTER_REJECT;
					return NodeFilter.FILTER_SKIP;
				});
				while ((slot = iterator.nextNode())) _slots[slot.getAttribute('name') || 'default'] = slot;
			}
			for (const [key, value] of Object.entries(slotted)) {
				if (_slots[key]) continue;
				_slots[key] = document.createElement('astro-slot');
				if (key !== 'default') _slots[key].setAttribute('name', key);
				_slots[key].innerHTML = value;
			}
		}
		const { default: children, ...slots } = _slots;
		const renderId = element.dataset.solidRenderId;
		if (alreadyInitializedElements.has(element)) {
			alreadyInitializedElements.get(element)(
				// reconcile will make sure to apply as little updates as possible, and also remove missing values w/o breaking reactivity
				reconcile({
					...props,
					...slots,
					children,
				}),
			);
		} else {
			const [store, setStore] = createStore({
				...props,
				...slots,
				children,
			});
			alreadyInitializedElements.set(element, setStore);
			const dispose = bootstrap(
				() => {
					const inner = () => createComponent(Component, store);
					if (isHydrate) {
						return createComponent(Suspense, {
							get children() {
								return inner();
							},
						});
					} else {
						return inner();
					}
				},
				element,
				{
					renderId,
				},
			);
			element.addEventListener('astro:unmount', () => dispose(), { once: true });
		}
	};
export { client_default as default };
