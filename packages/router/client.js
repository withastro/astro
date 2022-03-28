import morph from 'micromorph';

function getRoutePath(...args) {
	return args.map(arg => arg.replace(/^\/|\/$/, '')).join('/');
}

const s = new XMLSerializer();
const p = new DOMParser();
const initialChildren = new Set(Array.from(document.head.children).map(child => s.serializeToString(child)));
class RouterOutlet extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() {
		this.isUpdating = false;
		this.updateLinks();
	}
	updateLinks() {
		const current = this.getAttribute('route');
		const links = document.querySelectorAll(`router-link[for="${this.getAttribute('id')}"]`);
		for (const link of links) {
			if (current === link.getAttribute('to')) {
				link.parentElement.setAttribute("aria-current", "true");
			} else {
				link.parentElement.removeAttribute("aria-current");
			}
		}
	}
	mergeHead(newHead) {
		const currentChildren = new Map(Array.from(document.head.children).map(child => [s.serializeToString(child), child]));
		const newChildren = new Map(Array.from(newHead.children).map(child => [s.serializeToString(child), child]).filter(([key]) => !currentChildren.has(key) && !initialChildren.has(key) && !(!import.meta.env.PROD && key.includes('astro&amp;type=script&amp;index=0'))));
		for (const [key, child] of currentChildren.entries()) {
			if (initialChildren.has(key) || newChildren.has(key)) continue;
			child.remove();
		}
		document.head.append(...newChildren.values());
	}
	static get observedAttributes() { return ['route']; }
	async attributeChangedCallback(_, oldValue, newValue) {
		if (!this.isConnected) return;
		if (this.isUpdating) return;
		if (oldValue === newValue) return;
		this.isUpdating = true;
		const text = await fetch(`/routes/${getRoutePath(this.getAttribute('id'), newValue)}`).then(res => res.text());
		const { head, body } = p.parseFromString(text, 'text/html');
		const clone = this.cloneNode(true);
		clone.replaceChildren(...body.children);
		this.mergeHead(head);
		await morph(this, clone);
		this.updateLinks();
		this.isUpdating = false;
	}
}
customElements.define('router-outlet', RouterOutlet);

class RouterLink extends HTMLElement {
	constructor() {
		super();
		this.handleClick = this.handleClick.bind(this);
	}
	handleClick(event) {
		event.preventDefault();
		event.stopPropagation();
		this.target.setAttribute('route', this.getAttribute('to'));
	}
	connectedCallback() {
		this.target = document.querySelector(`router-outlet#${this.getAttribute('for')}`);
		this.parentElement.addEventListener('click', this.handleClick);
	}
	disconnectedCallback() {
		this.target = null;
		this.parentElement.removeEventListener('click', this.handleClick);
	}
}
customElements.define('router-link', RouterLink);
