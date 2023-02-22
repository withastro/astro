const noop = () => {};

export default (target) => {
	return (Component, props, slotted, { client }) => {
		if (!target.hasAttribute('ssr')) return;
		const slots = {};
		for (const [key, value] of Object.entries(slotted)) {
			slots[key] = createSlotDefinition(key, value);
		}
		try {
			new Component({
				target,
				props: {
					...props,
					$$slots: slots,
					$$scope: { ctx: [] },
				},
				hydrate: client !== 'only',
				$$inline: true,
			});
		} catch (e) {}
	};
};

function createSlotDefinition(key, children) {
	let parent;
	return [
		() => ({
			// mount
			m(target) {
				parent = target;
				target.insertAdjacentHTML(
					'beforeend',
					`<astro-slot${key === 'default' ? '' : ` name="${key}"`}>${children}</astro-slot>`
				);
			},
			// create
			c: noop,
			// hydrate
			l: noop,
			// destroy
			d() {
				if (!parent) return;
				const slot = parent.querySelector(
					`astro-slot${key === 'default' ? ':not([name])' : `[name="${key}"]`}`
				);
				if (slot) slot.remove();
			},
		}),
		noop,
		noop,
	];
}
