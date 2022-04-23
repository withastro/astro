import { sharedConfig } from 'solid-js';
import { hydrate, createComponent } from 'solid-js/web';

export default (element) => (Component, props, childHTML) => {
	// Prepare global object expected by Solid's hydration logic
	if (!window._$HY) {
		window._$HY = { events: [], completed: new WeakSet(), r: {} };
	}
	// Perform actual hydration
	let children;
	hydrate(
		() =>
			createComponent(Component, {
				...props,
				get children() {
					if (childHTML != null) {
						// hydrating
						if (sharedConfig.context) children = element.querySelector('astro-fragment');

						if (children == null) {
							children = document.createElement('astro-fragment');
							children.innerHTML = childHTML;
						}
					}
					return children;
				},
			}),
		element
	);
};
