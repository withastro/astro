import { sharedConfig } from 'solid-js';
import { hydrate, createComponent } from 'solid-js/web';

export default (element) => (Component, props, childHTML) => {
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
