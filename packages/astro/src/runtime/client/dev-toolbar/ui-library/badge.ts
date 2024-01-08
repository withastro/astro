type BadgeSize = 'small' | 'large';
type BadgeStyle = 'purple' | 'gray' | 'red' | 'green' | 'yellow';

export class DevToolbarBadge extends HTMLElement {
	size: BadgeSize = 'small';
	badgeStyle: BadgeStyle = 'purple';

	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		if (this.hasAttribute('size')) this.size = this.getAttribute('size') as BadgeSize;

		if (this.hasAttribute('badge-style'))
			this.badgeStyle = this.getAttribute('badge-style') as BadgeStyle;

		const classes = [`badge--${this.size}`, `badge--${this.badgeStyle}`];
		this.shadowRoot.innerHTML = `
			<style>
				.badge {
					box-sizing: border-box;
					border-radius: 4px;
					border: 1px solid transparent;
					padding: 8px;
					font-size: 12px;
					color: #fff;
					height: 20px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
				}

				.badge--large {
					height: 24px;
				}

				.badge--gray {
					color: rgba(191, 193, 201, 1);
					border-color: rgba(191, 193, 201, 1);
				}

				.badge--purple {
					color: rgba(224, 204, 250, 1);
					border-color: rgba(113, 24, 226, 1);
				}

				.badge--red {
					color: rgba(249, 196, 215, 1);
					border-color: rgba(179, 62, 102, 1);
				}

				.badge--green {
					color: rgba(213, 249, 196, 1);
					border-color: rgba(61, 125, 31, 1);
				}

				.badge--yellow {
					color: rgba(249, 233, 196, 1);
					border-color: rgba(181, 138, 45, 1);
				}
			</style>

			<div class="badge ${classes.join(' ')}">
				<slot></slot>
			</div>
			`;
	}
}
