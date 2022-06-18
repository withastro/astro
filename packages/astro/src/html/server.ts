export function check(Component: any) {
	return !!Component['astro:html'];
}

export async function renderToStaticMarkup(Component)
) {
	const slots: Record<string, any> = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key);
		slots[name] = value;
	}

	const { result } = this;
	try {
		const html = await renderJSX(result, jsx(Component, { ...props, ...slots, children }));
		return { html };
	} catch (e) {}
}

export default {
	check,
	renderToStaticMarkup,
};
