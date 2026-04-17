export type SavedFocus = {
	activeElement: HTMLElement | null;
	start?: number | null;
	end?: number | null;
};

const PERSIST_ATTR = 'data-astro-transition-persist';

const NON_OVERRIDABLE_ASTRO_ATTRS = ['data-astro-transition', 'data-astro-transition-fallback'];

const scriptsAlreadyRan = new Set<string>();
export function detectScriptExecuted(script: HTMLScriptElement) {
	const key = script.src ? new URL(script.src, location.href).href : script.textContent!;
	if (scriptsAlreadyRan.has(key)) return true;
	scriptsAlreadyRan.add(key);
	return false;
}

/*
 * 	Mark new scripts that should not execute
 */
export function deselectScripts(doc: Document) {
	for (const s2 of doc.scripts) {
		if (
			// Check if the script should be rerun regardless of it being the same
			!s2.hasAttribute('data-astro-rerun') &&
			// Check if the script has already been executed
			detectScriptExecuted(s2)
		) {
			// the old script is in the new document and doesn't have the rerun attribute
			// we mark it as executed to prevent re-execution
			s2.dataset.astroExec = '';
		}
	}
}

/*
 * swap attributes of the html element
 * delete all attributes from the current document
 * insert all attributes from doc
 * reinsert all original attributes that are referenced in NON_OVERRIDABLE_ASTRO_ATTRS'
 */
export function swapRootAttributes(newDoc: Document) {
	const currentRoot = document.documentElement;
	const nonOverridableAstroAttributes = [...currentRoot.attributes].filter(
		({ name }) => (currentRoot.removeAttribute(name), NON_OVERRIDABLE_ASTRO_ATTRS.includes(name)),
	);
	[...newDoc.documentElement.attributes, ...nonOverridableAstroAttributes].forEach(
		({ name, value }) => currentRoot.setAttribute(name, value),
	);
}

/*
 * make the old head look like the new one
 */
export function swapHeadElements(doc: Document) {
	for (const el of Array.from(document.head.children)) {
		const newEl = persistedHeadElement(el as HTMLElement, doc);
		// If the element exists in the document already, remove it
		// from the new document and leave the current node alone
		if (newEl) {
			newEl.remove();
		} else {
			// Otherwise, remove the element in the head. It doesn't exist in the new page.
			el.remove();
		}
	}

	// Everything left in the new head is new, append it all.
	document.head.append(...doc.head.children);
}

export function swapBodyElement(newElement: Element, oldElement: Element) {
	// Lift persist elements to <html> before the body swap so they stay in the DOM
	// throughout replaceWith(). This prevents Safari from losing WebGL context on
	// <canvas> elements due to brief DOM detachment. Uses moveBefore() where available
	// (Chrome 133+) for zero-detachment atomic moves.
	const persistPairs: { old: Element; newTarget: Element }[] = [];
	const docEl = oldElement.ownerDocument.documentElement;

	// moveBefore() is not yet in TypeScript's DOM lib, feature-detect and wrap.
	const moveBefore: ((parent: Node, node: Node, child: Node | null) => void) | null =
		typeof (docEl as any).moveBefore === 'function'
			? (parent, node, child) => (parent as any).moveBefore(node, child)
			: null;

	for (const el of oldElement.querySelectorAll(`[${PERSIST_ATTR}]`)) {
		const id = el.getAttribute(PERSIST_ATTR);
		const newEl = newElement.querySelector(`[${PERSIST_ATTR}="${id}"]`);
		if (!newEl) continue; // no matching target — leave in old body to be discarded
		persistPairs.push({ old: el, newTarget: newEl });
		if (moveBefore) {
			moveBefore(docEl, el, null);
		} else {
			docEl.appendChild(el);
		}
	}

	// this will reset scroll Position
	oldElement.replaceWith(newElement);

	// Move persist elements into the new body at the position of their targets
	for (const { old: el, newTarget } of persistPairs) {
		if (moveBefore) {
			moveBefore(newTarget.parentNode!, el, newTarget);
			newTarget.remove();
		} else {
			newTarget.replaceWith(el);
		}
		// For islands, copy over the props to allow them to re-render
		if (
			newTarget.localName === 'astro-island' &&
			shouldCopyProps(el as HTMLElement) &&
			!isSameProps(el, newTarget)
		) {
			el.setAttribute('ssr', '');
			el.setAttribute('props', newTarget.getAttribute('props')!);
		}
	}

	// This will upgrade any Declarative Shadow DOM in the new body.
	attachShadowRoots(newElement);
}

/**
 * Attach Shadow DOM roots for templates with the declarative `shadowrootmode` attribute.
 * @see https://github.com/withastro/astro/issues/14340
 * @see https://web.dev/articles/declarative-shadow-dom#polyfill
 * @param root DOM subtree to attach shadow roots within.
 */
function attachShadowRoots(root: Element | ShadowRoot) {
	root.querySelectorAll<HTMLTemplateElement>('template[shadowrootmode]').forEach((template) => {
		const mode = template.getAttribute('shadowrootmode');
		const parent = template.parentNode;
		if ((mode === 'closed' || mode === 'open') && parent instanceof HTMLElement) {
			// Skip if shadow root already exists (e.g., from transition-persisted elements)
			if (parent.shadowRoot) {
				template.remove();
				return;
			}
			const shadowRoot = parent.attachShadow({ mode });
			shadowRoot.appendChild(template.content);
			template.remove();
			attachShadowRoots(shadowRoot);
		}
	});
}

export const saveFocus = (): (() => void) => {
	const activeElement = document.activeElement as HTMLElement;
	// The element that currently has the focus is part of a DOM tree
	// that will survive the transition to the new document.
	// Save the element and the cursor position
	if (activeElement?.closest(`[${PERSIST_ATTR}]`)) {
		if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
			const start = activeElement.selectionStart;
			const end = activeElement.selectionEnd;
			return () => restoreFocus({ activeElement, start, end });
		}
		return () => restoreFocus({ activeElement });
	} else {
		return () => restoreFocus({ activeElement: null });
	}
};

export const restoreFocus = ({ activeElement, start, end }: SavedFocus) => {
	if (activeElement) {
		activeElement.focus();
		if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
			if (typeof start === 'number') activeElement.selectionStart = start;
			if (typeof end === 'number') activeElement.selectionEnd = end;
		}
	}
};

// Check for a head element that should persist and returns it,
// either because it has the data attribute or because replacing it would cause avoidable FOUC.
const persistedHeadElement = (el: HTMLElement, newDoc: Document): Element | null => {
	const id = el.getAttribute(PERSIST_ATTR);
	const newEl = id && newDoc.head.querySelector(`[${PERSIST_ATTR}="${id}"]`);
	if (newEl) {
		return newEl;
	}
	if (el.matches('link[rel=stylesheet]')) {
		const href = el.getAttribute('href');
		return newDoc.head.querySelector(`link[rel=stylesheet][href="${href}"]`);
	}
	// In dev mode, Vite injects <style data-vite-dev-id="..."> elements whose
	// textContent may later be transformed (especially Vue's `:deep()` → `[data-v-xxx]`).
	// Match these by their stable dev ID so the already-transformed style is preserved
	// across ClientRouter soft navigations instead of being replaced by the raw version.
	// There are other ids that can't be preserved and need a refresh, like Uno's /__uno.css,
	// which keeps the id with different contents.
	// To avoid enumerating all exceptions, we only apply the auto-persist logic to elements
	// that look like Vue's dev styles.
	if (import.meta.env.DEV && el.tagName === 'STYLE') {
		const viteDevId = el.getAttribute('data-vite-dev-id');
		if (/\?vue&type=style&.*lang.css$/.test(viteDevId || '')) {
			return newDoc.head.querySelector(`style[data-vite-dev-id="${viteDevId}"]`);
		}
	}
	// Preserve inline <style> elements with identical content across navigations.
	// This prevents unnecessary removal and re-insertion of styles (e.g. @font-face
	// declarations from <Font>), which would cause the browser to re-evaluate them
	// and trigger a flash of unstyled text (FOUT).
	if (el.tagName === 'STYLE' && el.textContent) {
		const styles = newDoc.head.querySelectorAll('style');
		for (const s of styles) {
			if (s.textContent === el.textContent) {
				return s;
			}
		}
	}
	// Preserve font preload links across navigations to avoid re-fetching cached fonts.
	if (el.matches('link[rel=preload][as=font]')) {
		const href = el.getAttribute('href');
		return newDoc.head.querySelector(`link[rel=preload][as=font][href="${href}"]`);
	}
	return null;
};

const shouldCopyProps = (el: HTMLElement): boolean => {
	const persistProps = el.dataset.astroTransitionPersistProps;
	return persistProps == null || persistProps === 'false';
};

const isSameProps = (oldEl: Element, newEl: Element) => {
	return oldEl.getAttribute('props') === newEl.getAttribute('props');
};

export const swapFunctions = {
	deselectScripts,
	swapRootAttributes,
	swapHeadElements,
	swapBodyElement,
	saveFocus,
};

export const swap = (doc: Document) => {
	deselectScripts(doc);
	swapRootAttributes(doc);
	swapHeadElements(doc);
	const restoreFocusFunction = saveFocus();
	swapBodyElement(doc.body, document.body);
	restoreFocusFunction();
};
