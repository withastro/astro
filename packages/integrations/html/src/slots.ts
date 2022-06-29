export const SLOT_PREFIX = `___SLOTS___`
export function transformSlots(document: Document) {
	for (const slot of document.querySelectorAll('slot')) {
		if (slot.closest('template')) continue;
		if (slot.hasAttribute('is:inline')) {
			slot.removeAttribute('is:inline');
			continue;
		}
		slot.replaceWith(document.createTextNode(`\${${SLOT_PREFIX}['${slot.getAttribute('name') || 'default'}'] ?? ${JSON.stringify(slot.innerHTML)}}`));
	}
}
