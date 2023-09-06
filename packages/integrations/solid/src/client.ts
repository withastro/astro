import { createComponent, hydrate, render } from 'solid-js/web';

export default (element: HTMLElement) =>
	(Component: any, props: any, slotted: any, { client }: { client: string }) => {
		// Prepare global object expected by Solid's hydration logic
		if (!(window as any)._$HY) {
			(window as any)._$HY = { events: [], completed: new WeakSet(), r: {} };
		}
		if (!element.hasAttribute('ssr')) return;

		const boostrap = client === 'only' ? render : hydrate;

		let slot: HTMLElement | null;
		let _slots: Record<string, any> = {};
		if (Object.keys(slotted).length > 0) {
			// hydratable
			if (client !== 'only') {
				const iterator = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, (node) => {
					if (node === element) return NodeFilter.FILTER_SKIP;
					if (node.nodeName === 'ASTRO-SLOT') return NodeFilter.FILTER_ACCEPT;
					if (node.nodeName === 'ASTRO-ISLAND') return NodeFilter.FILTER_REJECT;
					return NodeFilter.FILTER_SKIP;
				});
				while ((slot = iterator.nextNode() as HTMLElement | null))
					_slots[slot.getAttribute('name') || 'default'] = slot;
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

		const dispose = boostrap(
			() =>
				createComponent(Component, {
					...props,
					...slots,
					children,
				}),
			element,
			{
				renderId,
			}
		);

		element.addEventListener('astro:unmount', () => dispose(), { once: true });
	};
