export default (element: HTMLElement) => async (Component: any, props: Record<string, any>) => {
	// Get the LitElement element instance (may or may not be upgraded).
	const component = element.children[0] as HTMLElement;

	// If there is no deferral of hydration, then all reactive properties are
	// already serialzied as reflected attributes, or no reactive props were set
	if (!component || !component.hasAttribute('defer-hydration')) {
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
