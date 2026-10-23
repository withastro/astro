// Client runtime: revives server-bound signals, finds component instances
// from their comment markers, and runs each `<script scoped>` once per
// instance with a `scope` bound to it.
import { reconcile } from './reconcile.js';
import { effect, type Signal, signal } from './signals.js';
import type { List, Reactive, Ref, RowScope, Scope } from './types.js';

const ELEMENT_NODE = 1;
const COMMENT_NODE = 8;
const SHOW_ELEMENT = 0x1;
const SHOW_COMMENT = 0x80;

interface Instance {
	cid: string | null;
	name: string;
	/** The instance that rendered this one; owns content passed into its slots. */
	outer?: Instance;
}

interface Bindings {
	text?: Signal<any>;
	value?: Signal<any>;
	checked?: Signal<boolean>;
	attrs: Map<string, Signal<any>>;
}

type FormControl = HTMLInputElement;

export type ScopedScript = (scope: Scope) => void;

export function createRuntime(document: Document) {
	const PAGE: Instance = { cid: null, name: 'page' };
	const signals = new Map<string, Signal<any>>();
	const owners = new WeakMap<Element, Instance>();
	const instances: Instance[] = [];
	const bindings = new WeakMap<Element, Bindings>();
	const refs = new WeakMap<Element, Ref>();

	function revive(id: string, encoded: string) {
		let s = signals.get(id);
		if (!s) signals.set(id, (s = signal(JSON.parse(decodeURIComponent(encoded)))));
		return s;
	}

	function bindingsOf(el: Element) {
		let b = bindings.get(el);
		if (!b) bindings.set(el, (b = { attrs: new Map() }));
		return b;
	}

	// One pass over the document: comment markers tell us which instance owns
	// each element, and binding markers revive signals.
	function scan() {
		const stack: { owner: Instance; inst?: Instance }[] = [{ owner: PAGE }];
		const walker = document.createTreeWalker(document.documentElement, SHOW_ELEMENT | SHOW_COMMENT);
		const textStarts: Comment[] = [];

		for (let node: Node | null = walker.currentNode; node; node = walker.nextNode()) {
			if (node.nodeType === ELEMENT_NODE) {
				const el = node as Element;
				owners.set(el, stack[stack.length - 1].owner);
				for (const attr of Array.from(el.attributes)) {
					if (attr.name.startsWith('data-ui-a-')) bindAttr(el, attr.name.slice(10), attr.value);
				}
				continue;
			}
			const data = (node as Comment).data;
			if (data.startsWith('ui:i ')) {
				const inst: Instance = {
					cid: data.slice(5),
					name: '',
					outer: stack[stack.length - 1].owner,
				};
				instances.push(inst);
				stack.push({ owner: inst, inst });
			} else if (data === '/ui:i') {
				stack.pop();
			} else if (data === 'ui:s') {
				// Slotted content belongs to whoever used the component.
				const inst = stack.findLast((f) => f.inst)!.inst!;
				stack.push({ owner: inst.outer ?? PAGE });
			} else if (data === '/ui:s') {
				stack.pop();
			} else if (data.startsWith('ui:t ')) {
				textStarts.push(node as Comment);
			}
		}

		for (const open of textStarts) bindText(open);
	}

	function bindText(open: Comment) {
		const [, id, encoded] = open.data.split(' ');
		const s = revive(id, encoded);
		// Collapse whatever is between the markers into one text node we own.
		let node = open.nextSibling;
		while (node && !(node.nodeType === COMMENT_NODE && (node as Comment).data === '/ui:t')) {
			const next = node.nextSibling;
			node.remove();
			node = next;
		}
		const text = document.createTextNode('');
		open.after(text);
		effect(() => {
			text.data = String(s() ?? '');
		});
		if (open.parentElement) bindingsOf(open.parentElement).text ??= s;
	}

	function bindAttr(el: Element, name: string, raw: string) {
		const i = raw.indexOf(':');
		const s = revive(raw.slice(0, i), raw.slice(i + 1));
		const b = bindingsOf(el);
		if (name === 'value' && 'value' in el) {
			twoWay(el as FormControl, s, 'value', 'input');
			b.value = s;
		} else if (name === 'checked' && 'checked' in el) {
			twoWay(el as FormControl, s, 'checked', 'change');
			b.checked = s;
		} else {
			effect(() => {
				setAttr(el, name, s());
			});
			b.attrs.set(name, s);
		}
	}

	function twoWay(el: FormControl, s: Signal<any>, prop: 'value' | 'checked', event: string) {
		const numeric = typeof s() === 'number';
		effect(() => {
			const v = prop === 'checked' ? !!s() : String(s() ?? '');
			if (el[prop] !== v) (el as unknown as Record<string, unknown>)[prop] = v;
		});
		el.addEventListener(event, () => {
			const v = el[prop];
			s(numeric && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : v);
		});
	}

	function setAttr(el: Element, name: string, v: unknown) {
		if (v === false || v == null) el.removeAttribute(name);
		else el.setAttribute(name, v === true ? '' : String(v));
	}

	function ownerOf(el: Element) {
		for (let n: Element | null = el; n; n = n.parentElement) {
			const o = owners.get(n);
			if (o) return o;
		}
		return PAGE;
	}

	// -------------------------------------------------------------------------
	// scope()

	function makeScope(label: string, query: (selector: string) => Element[]): Scope {
		const one = ((selector: string) => {
			const el = query(selector)[0];
			if (!el) throw new Error(`[@astrojs/ui] scope('${selector}') matched nothing in ${label}`);
			return ref(el);
		}) as Scope;
		one.all = (selector) => query(selector).map(ref);
		one.list = (container, template, factory) =>
			list(one(container).el, one(template).el as HTMLTemplateElement, factory);
		return one;
	}

	function instanceScope(inst: Instance) {
		return makeScope(`<${inst.name}>`, (selector) =>
			Array.from(document.querySelectorAll(selector)).filter((el) => ownerOf(el) === inst),
		);
	}

	function elementScope(root: Element, label: string): RowScope {
		const scope = makeScope(label, (selector) => [
			...(root.matches(selector) ? [root] : []),
			...Array.from(root.querySelectorAll(selector)),
		]) as RowScope;
		scope.root = ref(root);
		return scope;
	}

	function ref(el: Element): Ref {
		const existing = refs.get(el);
		if (existing) return existing;
		const b = bindingsOf(el);
		const control = el as FormControl;
		// Effects must not return anything: alien-signals treats a return value as cleanup.
		const derive = (fn: Reactive<unknown>, apply: (v: unknown) => void) =>
			effect(() => {
				apply(typeof fn === 'function' ? fn() : fn);
			});

		const r = {
			el,
			// With no argument, these return the signal bound to the element (the
			// server one if it was bound in the template). With a function, they
			// keep the element in sync with it instead.
			text(fn?: Reactive<unknown>): any {
				if (fn !== undefined) {
					derive(fn, (v) => {
						el.textContent = String(v ?? '');
					});
					return r;
				}
				if (!b.text) {
					const s = signal(el.textContent);
					effect(() => {
						const v = String(s() ?? '');
						if (el.textContent !== v) el.textContent = v;
					});
					b.text = s;
				}
				return b.text;
			},
			value() {
				if (!b.value) {
					b.value = signal(control.value);
					twoWay(control, b.value, 'value', 'input');
				}
				return b.value;
			},
			checked() {
				if (!b.checked) {
					b.checked = signal(control.checked);
					twoWay(control, b.checked, 'checked', 'change');
				}
				return b.checked;
			},
			attr(name: string, fn?: Reactive<unknown>): any {
				if (fn !== undefined) {
					derive(fn, (v) => setAttr(el, name, v));
					return r;
				}
				let s = b.attrs.get(name);
				if (!s) {
					const created = signal(el.getAttribute(name));
					effect(() => {
						setAttr(el, name, created());
					});
					b.attrs.set(name, (s = created));
				}
				return s;
			},
			class(name: string, fn: Reactive<unknown>) {
				derive(fn, (v) => el.classList.toggle(name, !!v));
				return r;
			},
			show(fn: Reactive<unknown>) {
				// `hidden` alone loses to any CSS `display` rule, so set both.
				derive(fn, (v) => {
					(el as HTMLElement).hidden = !v;
					(el as HTMLElement).style.display = v ? '' : 'none';
				});
				return r;
			},
			on(event: string, handler: (e: Event) => void) {
				el.addEventListener(event, handler);
				return r;
			},
		} as Ref;
		refs.set(el, r);
		return r;
	}

	// -------------------------------------------------------------------------
	// list(): attaches to server-rendered rows and clones <template> for new ones.

	function list<T>(
		container: Element,
		template: HTMLTemplateElement,
		factory: (row: RowScope) => T,
	): List<T> {
		// Rows stay attached to their items, so removed items can come back.
		const elOf = new WeakMap<object, Element>();
		const make = (el: Element) => {
			const item = factory(elementScope(el, 'list row'));
			elOf.set(item as object, el);
			return item;
		};
		const rows = Array.from(container.children).filter((c) => c.tagName !== 'TEMPLATE');
		const items = signal(rows.map(make));
		let current = items();

		effect(() => {
			const next = items();
			reconcile(container, current, next, (item) => elOf.get(item as object)!);
			current = next;
		});

		const api: List<T> = {
			items,
			create(data = {}) {
				const el = template.content.firstElementChild!.cloneNode(true) as Element;
				const item = make(el) as Record<string, unknown>;
				for (const [k, v] of Object.entries(data)) {
					if (typeof item[k] === 'function') (item[k] as Signal<unknown>)(v);
					else item[k] = v;
				}
				return item as T;
			},
			add(data) {
				const item = api.create(data);
				items([...items(), item]);
				return item;
			},
			remove(item) {
				items(items().filter((i) => i !== item));
			},
		};
		return api;
	}

	// -------------------------------------------------------------------------

	let started = false;

	/** Scans the document for instances and bindings. Safe to call more than once. */
	function start() {
		if (started) return;
		started = true;
		scan();
	}

	/** Runs a scoped script once per instance of component `cid`, or once for the page. */
	function register(cid: string | null, name: string, fn: ScopedScript) {
		start();
		if (cid === null) {
			fn(
				makeScope('page', (s) =>
					Array.from(document.querySelectorAll(s)).filter((el) => ownerOf(el) === PAGE),
				),
			);
			return;
		}
		for (const inst of instances) {
			if (inst.cid !== cid) continue;
			inst.name = name;
			fn(instanceScope(inst));
		}
	}

	return { start, register };
}
