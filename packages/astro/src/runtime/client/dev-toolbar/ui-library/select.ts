export class DevToolbarSelect extends HTMLElement {
	shadowRoot: ShadowRoot;
	element: HTMLSelectElement;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          --gray-text: rgba(191, 193, 201, 1);
          --gray-border: rgba(145, 152, 173, 1);

          --text-color: var(--gray-text);
          --border-color: var(--gray-border);
        }
        select {
          appearance: none;
          text-align-last: center;
          display: inline-block;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          padding: 4px 24px 4px 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-color);
          background-color: transparent;
          background-image:
            linear-gradient(45deg, transparent 50%, var(--text-color) 50%),
            linear-gradient(135deg, var(--text-color) 50%, transparent 50%);
          background-position:
            calc(100% - 12px) calc(1em - 2px),
            calc(100% - 8px) calc(1em - 2px);
          background-size: 4px 4px;
          background-repeat: no-repeat;
        }
      </style>
      <slot></slot>
    `;
		this.element = document.createElement('select');
		this.shadowRoot.addEventListener('slotchange', (event) => {
			if (event.target instanceof HTMLSlotElement) {
				// Manually add slotted elements to <select> because it only accepts <option> as children and escapes other elements including <slot>
				this.element.append(...event.target.assignedNodes());
			}
		});
	}

	connectedCallback() {
		this.shadowRoot.append(this.element);
	}
}
