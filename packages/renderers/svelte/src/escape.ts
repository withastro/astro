/**
 * Escapes a slot name for use inside a double-quoted HTML attribute value.
 */
export function escapeSlotName(name: string): string {
	return name
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
