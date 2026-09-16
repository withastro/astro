import { defineComponent, h, ref } from 'vue';

export default defineComponent({
	setup() {
		const count = ref(0);
		return () => h('div', { id: 'js-counter' }, [
			h('span', { class: 'count' }, String(count.value)),
		]);
	},
});
