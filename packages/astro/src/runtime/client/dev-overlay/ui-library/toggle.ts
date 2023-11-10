export class DevOverlayToggle extends HTMLElement {
	shadowRoot: ShadowRoot;
	inputId?: string;

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
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';

		if (this.hasAttribute('input-id') || this.inputId) {
			checkbox.id = this.getAttribute('input-id') ?? this.inputId ?? '';
		}
		this.shadowRoot.append(checkbox);
	}
}
