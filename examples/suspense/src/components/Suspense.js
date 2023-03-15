import { createComponent, render, renderSlot, renderSuspense } from 'astro/runtime/server/index.js';

let ids = new WeakMap();
export default createComponent({
	factory(result, props, slots) {
		const id = (ids.get(result) ?? -1) + 1;
		ids.set(result, id);
		let suspense = { status: 'pending' }
		suspense.value = renderSuspense(result, id, slots.default).then((result) => {
			suspense.status = 'fulfilled';
			return result;
		})
		result.suspense.set(id, suspense);

		return render`<astro-placeholder uid="${id}">${renderSlot(result, slots.fallback)}</astro-placeholder>`
	}
})
