export class DevToolbarToggle extends HTMLElement {
	shadowRoot: ShadowRoot;
	input: HTMLInputElement;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		this.shadowRoot.innerHTML = `
		<style>
			input {
				appearance: none;
				width: 32px;
				height: 20px;
				border: 1px solid rgba(145, 152, 173, 1);
				transition: background-color 0.2s ease, border-color 0.2s ease;
				border-radius: 9999px;
			}

			input::after {
				content: '';
				width: 16px;
				display: inline-block;
				height: 16px;
				background-color: rgba(145, 152, 173, 1);
				border-radius: 9999px;
				transition: transform 0.2s ease, background-color 0.2s ease;
				top: 1px;
				left: 1px;
				position: relative;
			}

			@media (forced-colors: active) {
				input::after {
					border: 1px solid black;
					top: 0px;
					left: 0px;
				}
			}

			input:checked {
				border: 1px solid rgba(213, 249, 196, 1);
				background-color: rgba(61, 125, 31, 1);
			}

			input:checked::after {
				transform: translateX(12px);
				background: rgba(213, 249, 196, 1);
			}
		</style>
		`;

		this.input = document.createElement('input');
	}

	connectedCallback() {
		this.input.type = 'checkbox';
		this.shadowRoot.append(this.input);
	}

	get value() {
		return this.input.value;
	}

	set value(val) {
		this.input.value = val;
	}
}
