import { SERVER_ISLAND_START } from '../runtime/server/render/server-islands-shared.js';

export type SavedFocus = {
	activeElement: HTMLElement | null;
	start?: number | null;
	end?: number | null;
};

const PERSIST_ATTR = 'data-astro-transition-persist';

const NON_OVERRIDABLE_ASTRO_ATTRS = ['data-astro-transition', 'data-astro-transition-fallback'];

// Vite's CSS HMR runtime keeps references to the style nodes it injects, so preserve
// those nodes across ClientRouter head swaps. https://github.com/withastro/astro/pull/17612
const viteStyleState = import.meta.env.DEV
	? (() => {
			const styles = new Map<string, HTMLStyleElement>();
			let observer: MutationObserver | undefined;
			return {
				styles,
				observe() {
					if (observer) return;
					observer = new MutationObserver((records) => {
						for (const record of records) {
							for (const node of record.addedNodes) {
								if (!(node instanceof HTMLStyleElement)) continue;
								const viteDevId = node.dataset.viteDevId;
								if (!viteDevId) continue;
								const knownStyle = styles.get(viteDevId);
								if (node === knownStyle) continue;

								// ClientRouter appends the fetched style before Vite injects the node
								// registered for HMR. Replace it and track Vite's node instead.
								knownStyle?.remove();
								styles.set(viteDevId, node);
							}
						}
					});
					observer.observe(document.head, { childList: true });
				},
			};
		})()
	: undefined;

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
	// Elements and special server island comments
	const relevantNodes = (parent: Node, what: 'commentsOnly' | 'both' = 'both') => [
		...[...parent.childNodes].filter(
			(child) =>
				(child.nodeType === 8 && child.textContent === SERVER_ISLAND_START) ||
				(what === 'both' && child.nodeType === 1),
		),
	];

	for (const el of Array.from(document.head.children)) {
		const newEl = persistedHeadElement(el as HTMLElement, doc);
		// If the element exists in the document already, remove it
		// from the new document and leave the current node alone
		if (newEl) {
			newEl.remove();
		} else {
			if (import.meta.env.DEV && el instanceof HTMLStyleElement) {
				const viteDevId = el.dataset.viteDevId;
				viteDevId && viteStyleState?.styles.set(viteDevId, el);
			}
			// If the element does not exist in the new document, remove the element from current the head.
			el.remove();
		}
	}

	// Remove stale server island markers
	// that may have been left behind from a previous navigation.
	relevantNodes(document.head, 'commentsOnly').forEach((node) => node.remove());

	// Everything left in the new head is new, append it all.
	if (import.meta.env.DEV) {
		relevantNodes(doc.head).forEach((child) => {
			const viteDevId = child instanceof HTMLStyleElement && child.dataset.viteDevId;
			const knownStyle = viteDevId && viteStyleState?.styles.get(viteDevId);
			if (knownStyle) {
				// Generated styles such as UnoCSS can keep the same Vite ID while their CSS changes
				// between routes, so copy the incoming CSS into the style element Vite uses for HMR.
				// https://github.com/withastro/astro/pull/16242
				// Vue scoped styles are excluded because their content may be transformed in the browser.
				if (!vueScopedStyleId(knownStyle)) knownStyle.textContent = child.textContent;
				document.head.append(knownStyle);
			} else {
				if (viteDevId) {
					viteStyleState?.styles.set(viteDevId, child);
					viteStyleState?.observe();
				}
				document.head.append(child);
			}
		});
	} else {
		document.head.append(...relevantNodes(doc.head));
	}
}

export function swapBodyElement(newElement: Element, oldElement: Element) {
	// Lift persist elements to <html> before the body swap so they stay in the DOM
	// throughout replaceWith(). This prevents Safari from losing WebGL context on
	// <canvas> elements due to brief DOM detachment. Uses moveBefore() where available
	// (Chrome 133+) for zero-detachment atomic moves.
	const persistPairs: { old: Element; newTarget: Element }[] = [];
	const docEl = oldElement.ownerDocument.documentElement;
	// Media that are live right now. The only way for one of these nodes to end up in
	// the new body is the persist transfer below (a matched `transition:persist`
	// element moves with its whole subtree — so this also covers media inside an inner
	// persist container that has no counterpart on the new page, and the attribute
	// placed on the media element itself). Such nodes were never inert and must keep
	// their identity and playback state; see reifyMediaElements().
	const liveMedia = new Set<Element>(oldElement.querySelectorAll('video, audio'));

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

	// Re-create media elements so the browser initialises their media stack.
	// DOMParser produces elements in an inert document where <video>/<audio>
	// never get a media controller; moving them into the live DOM does not
	// retroactively initialise one, leaving controls disabled. Replacing each
	// element with a fresh copy created via document.createElement() forces
	// the browser to set up playback. See https://github.com/withastro/astro/issues/17601
	// Media carried over from the previous page were never inert: they are the live
	// nodes of the old body, and re-creating them would destroy their playback state.
	reifyMediaElements(newElement, liveMedia);
}

/**
 * Replace media elements with fresh copies created in the live document.
 * Elements parsed by DOMParser originate from an inert document where the browser
 * never initialises the media stack, leaving controls disabled after a view-transition
 * swap. Creating a fresh element via `document.createElement()` and copying attributes
 * and children forces proper initialisation.
 * Elements in `liveMedia` are skipped: they were already live in the old document and
 * reached the new body through `transition:persist` — replacing them would reset
 * `currentTime`/`paused` and drop listeners and framework refs.
 * @see https://github.com/withastro/astro/issues/17601
 */
function reifyMediaElements(root: Element, liveMedia: ReadonlySet<Element>) {
	for (const media of root.querySelectorAll<HTMLVideoElement | HTMLAudioElement>('video, audio')) {
		if (liveMedia.has(media)) continue;
		const fresh = document.createElement(media.localName);
		for (const attr of media.attributes) {
			fresh.setAttribute(attr.name, attr.value);
		}
		fresh.innerHTML = media.innerHTML;
		media.replaceWith(fresh);
	}
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

export const vueScopedStyleId = (el: HTMLStyleElement): string => {
	const viteDevId = el.dataset.viteDevId || '';

	const url = new URL(viteDevId, location.href);
	return url.searchParams.get('vue') !== null &&
		url.searchParams.get('type') === 'style' &&
		url.searchParams.has('scoped')
		? viteDevId
		: '';
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
	// Vue scoped CSS may be transformed in the browser, so preserve its current contents
	// across ClientRouter navigations. https://github.com/withastro/astro/pull/16379
	if (import.meta.env.DEV && el instanceof HTMLStyleElement) {
		const viteDevId = vueScopedStyleId(el);
		if (viteDevId) {
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
