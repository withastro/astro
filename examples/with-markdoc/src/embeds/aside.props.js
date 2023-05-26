import { defineProps, field } from '@astrojs/markdoc/props';

export const props = defineProps({
	type: field.enum(['note', 'tip', 'warning', 'danger']),
	title: field.string().optional(),
});
