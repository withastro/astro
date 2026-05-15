const PERSIST_ATTR = 'data-astro-transition-persist';
const NON_OVERRIDABLE_ASTRO_ATTRS = ['data-astro-transition', 'data-astro-transition-fallback'];
const knownVueScopedStyles = /* @__PURE__ */ new Map();
const scriptsAlreadyRan = /* @__PURE__ */ new Set();
function detectScriptExecuted(script) {
	const key = script.src ? new URL(script.src, location.href).href : script.textContent;
	if (scriptsAlreadyRan.has(key)) return true;
	scriptsAlreadyRan.add(key);
	return false;
}
function deselectScripts(doc) {
	for (const s2 of doc.scripts) {
		if (
			// Check if the script should be rerun regardless of it being the same
			!s2.hasAttribute('data-astro-rerun') && // Check if the script has already been executed
			detectScriptExecuted(s2)
		) {
			s2.dataset.astroExec = '';
		}
	}
}
function swapRootAttributes(newDoc) {
	const currentRoot = document.documentElement;
	const nonOverridableAstroAttributes = [...currentRoot.attributes].filter(
		({ name }) => (currentRoot.removeAttribute(name), NON_OVERRIDABLE_ASTRO_ATTRS.includes(name)),
	);
	[...newDoc.documentElement.attributes, ...nonOverridableAstroAttributes].forEach(
		({ name, value }) => currentRoot.setAttribute(name, value),
	);
}
function swapHeadElements(doc) {
	for (const el of Array.from(document.head.children)) {
		const newEl = persistedHeadElement(el, doc);
		if (newEl) {
			newEl.remove();
		} else {
			if (import.meta.env.DEV && el instanceof HTMLStyleElement) {
				const viteDevId = vueScopedStyleId(el);
				viteDevId && knownVueScopedStyles.set(viteDevId, el);
			}
			el.remove();
		}
	}
	if (import.meta.env.DEV) {
		[...doc.head.children].forEach((child) => {
			document.head.append(knownVueScopedStyles.get(child.dataset?.viteDevId) || child);
		});
	} else {
		document.head.append(...doc.head.children);
	}
}
function swapBodyElement(newElement, oldElement) {
	const persistPairs = [];
	const docEl = oldElement.ownerDocument.documentElement;
	const moveBefore =
		typeof docEl.moveBefore === 'function'
			? (parent, node, child) => parent.moveBefore(node, child)
			: null;
	for (const el of oldElement.querySelectorAll(`[${PERSIST_ATTR}]`)) {
		const id = el.getAttribute(PERSIST_ATTR);
		const newEl = newElement.querySelector(`[${PERSIST_ATTR}="${id}"]`);
		if (!newEl) continue;
		persistPairs.push({ old: el, newTarget: newEl });
		if (moveBefore) {
			moveBefore(docEl, el, null);
		} else {
			docEl.appendChild(el);
		}
	}
	oldElement.replaceWith(newElement);
	for (const { old: el, newTarget } of persistPairs) {
		if (moveBefore) {
			moveBefore(newTarget.parentNode, el, newTarget);
			newTarget.remove();
		} else {
			newTarget.replaceWith(el);
		}
		if (
			newTarget.localName === 'astro-island' &&
			shouldCopyProps(el) &&
			!isSameProps(el, newTarget)
		) {
			el.setAttribute('ssr', '');
			el.setAttribute('props', newTarget.getAttribute('props'));
		}
	}
	attachShadowRoots(newElement);
}
function attachShadowRoots(root) {
	root.querySelectorAll('template[shadowrootmode]').forEach((template) => {
		const mode = template.getAttribute('shadowrootmode');
		const parent = template.parentNode;
		if ((mode === 'closed' || mode === 'open') && parent instanceof HTMLElement) {
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
const saveFocus = () => {
	const activeElement = document.activeElement;
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
const restoreFocus = ({ activeElement, start, end }) => {
	if (activeElement) {
		activeElement.focus();
		if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
			if (typeof start === 'number') activeElement.selectionStart = start;
			if (typeof end === 'number') activeElement.selectionEnd = end;
		}
	}
};
const vueScopedStyleId = (el) => {
	const viteDevId = el.dataset.viteDevId || '';
	const url = new URL(viteDevId, location.href);
	return url.searchParams.get('vue') !== null &&
		url.searchParams.get('type') === 'style' &&
		url.searchParams.has('scoped')
		? viteDevId
		: '';
};
const persistedHeadElement = (el, newDoc) => {
	const id = el.getAttribute(PERSIST_ATTR);
	const newEl = id && newDoc.head.querySelector(`[${PERSIST_ATTR}="${id}"]`);
	if (newEl) {
		return newEl;
	}
	if (el.matches('link[rel=stylesheet]')) {
		const href = el.getAttribute('href');
		return newDoc.head.querySelector(`link[rel=stylesheet][href="${href}"]`);
	}
	if (import.meta.env.DEV && el instanceof HTMLStyleElement) {
		const viteDevId = vueScopedStyleId(el);
		if (viteDevId) {
			return newDoc.head.querySelector(`style[data-vite-dev-id="${viteDevId}"]`);
		}
	}
	if (el.tagName === 'STYLE' && el.textContent) {
		const styles = newDoc.head.querySelectorAll('style');
		for (const s of styles) {
			if (s.textContent === el.textContent) {
				return s;
			}
		}
	}
	if (el.matches('link[rel=preload][as=font]')) {
		const href = el.getAttribute('href');
		return newDoc.head.querySelector(`link[rel=preload][as=font][href="${href}"]`);
	}
	return null;
};
const shouldCopyProps = (el) => {
	const persistProps = el.dataset.astroTransitionPersistProps;
	return persistProps == null || persistProps === 'false';
};
const isSameProps = (oldEl, newEl) => {
	return oldEl.getAttribute('props') === newEl.getAttribute('props');
};
const swapFunctions = {
	deselectScripts,
	swapRootAttributes,
	swapHeadElements,
	swapBodyElement,
	saveFocus,
};
const swap = (doc) => {
	deselectScripts(doc);
	swapRootAttributes(doc);
	swapHeadElements(doc);
	const restoreFocusFunction = saveFocus();
	swapBodyElement(doc.body, document.body);
	restoreFocusFunction();
};
export {
	deselectScripts,
	detectScriptExecuted,
	restoreFocus,
	saveFocus,
	swap,
	swapBodyElement,
	swapFunctions,
	swapHeadElements,
	swapRootAttributes,
	vueScopedStyleId,
};
