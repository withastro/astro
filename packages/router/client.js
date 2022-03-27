import morph from 'micromorph';

function getRoutePath(...args) {
	return args.map(arg => arg.replace(/^\/|\/$/, '')).join('/');
}

const p = new DOMParser();
class RouterOutlet extends HTMLElement {
	connectedCallback() {
		this.isUpdating = false;
		this.updateLinks();
	}
	updateLinks() {
		document.querySelectorAll(`router-link[for="${this.getAttribute('id')}"]`).forEach(link => {
			link.ariaCurrent = (link.to === this.route);
		})
	}
	static get observedAttributes() { return ['route']; }
	async attributeChangedCallback(_, oldValue, newValue) {
		if (!this.isConnected) return;
		if (this.isUpdating) return;
		if (oldValue === newValue) return;
		this.isUpdating = true;
		const text = await fetch(`/routes/${getRoutePath(this.getAttribute('id'), newValue)}`).then(res => res.text());
		const children = p.parseFromString(text, 'text/html').body.children;
		const clone = this.cloneNode(true)
		clone.replaceChildren(...children);
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
		this.addEventListener('click', this.handleClick);
	}
	disconnectedCallback() {
		this.target = null;
		this.removeEventListener('click', this.handleClick);
	}
}
customElements.define('router-link', RouterLink);
