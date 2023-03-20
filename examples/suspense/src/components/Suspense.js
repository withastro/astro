// astro-head-inject
import { createComponent, createHeadAndContent, render, renderSlot, renderSuspense, renderComponent, unescapeHTML } from 'astro/runtime/server/index.js';

let ids = new WeakMap();
const Suspense = createComponent({
	factory(result, props, slots) {
		const { id } = props;
		let suspense = { status: 'pending' }
		let promise = renderSuspense(result, id, slots.default).then((result) => {
			suspense.status = 'fulfilled';
			return result;
		});
		suspense.value = promise;
		result.suspense.set(id, suspense);
		return render`<astro-placeholder uid="${id}">${renderSlot(result, slots.fallback)}</astro-placeholder>`
	}
})

export default createComponent({
	factory(result, _props, slots) {
		if (!ids.has(result.response)) {
			ids.set(result.response, -1);
		}
		let id = ids.get(result.response) + 1;
		ids.set(result.response, id);
		return createHeadAndContent(
			unescapeHTML(`<noscript><meta http-equiv="refresh" content="0;URL='${result._metadata.pathname}?noscript=1'"></noscript>`), 
			render`${renderComponent(result, 'Suspense', Suspense, { id }, slots)}`
		)
	},
	propagation: 'self'
})
