/**
 * Adds the appropriate slot attribute to each top-level node in the given HTML
 * string.
 *
 * @example
 * addSlotAttrsToHtmlString('foo', '<div>bar</div><div>baz</div>');
 * // '<div slot="foo">bar</div><div slot="foo">baz</div>'
 *
 * @param slotName Name of slot to apply to HTML string.
 * @param html Stringified HTML that should be projected into the given slotname.
 * @returns A stringified HTML string with the slot attribute applied to each top-level node.
 */
const addSlotAttrsToHtmlString = (slotName: string, html: string) => {
	const templ = document.createElement('template');
	templ.innerHTML = html;
	Array.from(templ.content.children).forEach((node) => {
		node.setAttribute('slot', slotName);
	});
	return templ.innerHTML;
};

export default (element: HTMLElement) =>
	async (
		Component: any,
		props: Record<string, any>,
		{ default: defaultChildren, ...slotted }: { default: string; [slotName: string]: string },
	) => {
		// Get the LitElement element instance.
		let component = element.children[0];
		// Check if hydration model is client:only
		const isClientOnly = element.getAttribute('client') === 'only';

		// We need to attach the element and it's children to the DOM since it's not
		// SSR'd.
		if (isClientOnly) {
			component = new Component();

			const otherSlottedChildren = Object.entries(slotted)
				.map(([slotName, htmlStr]) => addSlotAttrsToHtmlString(slotName, htmlStr))
				.join('');

			// defaultChildren can actually be undefined, but TS will complain if we
			// type it as so, make sure we don't render undefined.
			component.innerHTML = `${defaultChildren ?? ''}${otherSlottedChildren}`;
			element.appendChild(component);

			// Set props bound to non-reactive properties as attributes.
			for (let [name, value] of Object.entries(props)) {
				if (!(name in Component.prototype)) {
					component.setAttribute(name, value);
				}
			}
		}

		// If there is no deferral of hydration, then all reactive properties are
		// already serialized as reflected attributes, or no reactive props were set
		// Alternatively, if hydration is client:only proceed to set props.
		if (!component || !(component.hasAttribute('defer-hydration') || isClientOnly)) {
			return;
		}

		// Set properties on the LitElement instance for resuming hydration.
		for (let [name, value] of Object.entries(props)) {
			// Check if reactive property or class property.
			if (name in Component.prototype) {
				(component as any)[name] = value;
			}
		}

		// Tell LitElement to resume hydration.
		component.removeAttribute('defer-hydration');
	};
