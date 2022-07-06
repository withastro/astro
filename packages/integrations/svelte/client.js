const noop = () => {};

export default (target) => {
	return (Component, props, slotted, { client }) => {
		if (!target.hasAttribute('ssr')) return;
		delete props['class'];
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
	return [
		() => ({
			// mount
			m(target) {
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
			d: noop,
		}),
		noop,
		noop,
	];
}
