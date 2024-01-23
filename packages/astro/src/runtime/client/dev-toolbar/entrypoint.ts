import type { DevToolbarApp as DevToolbarAppDefinition } from '../../../@types/astro.js';
import { settings } from './settings.js';
import type { AstroDevToolbar, DevToolbarApp } from './toolbar.js';
// @ts-expect-error
import { loadDevToolbarApps } from 'astro:dev-toolbar';

let overlay: AstroDevToolbar;

document.addEventListener('DOMContentLoaded', async () => {
	const [
		customAppsDefinitions,
		{ default: astroDevToolApp },
		{ default: astroAuditApp },
		{ default: astroXrayApp },
		{ default: astroSettingsApp },
		{ AstroDevToolbar, DevToolbarCanvas, getAppIcon },
		{
			DevToolbarCard,
			DevToolbarHighlight,
			DevToolbarTooltip,
			DevToolbarWindow,
			DevToolbarToggle,
			DevToolbarButton,
			DevToolbarBadge,
			DevToolbarIcon,
		},
	] = await Promise.all([
		loadDevToolbarApps() as DevToolbarAppDefinition[],
		import('./apps/astro.js'),
		import('./apps/audit/index.js'),
		import('./apps/xray.js'),
		import('./apps/settings.js'),
		import('./toolbar.js'),
		import('./ui-library/index.js'),
	]);

	// Register custom elements
	customElements.define('astro-dev-toolbar', AstroDevToolbar);
	customElements.define('astro-dev-toolbar-window', DevToolbarWindow);
	customElements.define('astro-dev-toolbar-app-canvas', DevToolbarCanvas);
	customElements.define('astro-dev-toolbar-tooltip', DevToolbarTooltip);
	customElements.define('astro-dev-toolbar-highlight', DevToolbarHighlight);
	customElements.define('astro-dev-toolbar-card', DevToolbarCard);
	customElements.define('astro-dev-toolbar-toggle', DevToolbarToggle);
	customElements.define('astro-dev-toolbar-button', DevToolbarButton);
	customElements.define('astro-dev-toolbar-badge', DevToolbarBadge);
	customElements.define('astro-dev-toolbar-icon', DevToolbarIcon);

	// Add deprecated names
	// TODO: Remove in Astro 5.0
	const deprecated = (Parent: any) => class extends Parent {};
	customElements.define('astro-dev-overlay', deprecated(AstroDevToolbar));
	customElements.define('astro-dev-overlay-window', deprecated(DevToolbarWindow));
	customElements.define('astro-dev-overlay-plugin-canvas', deprecated(DevToolbarCanvas));
	customElements.define('astro-dev-overlay-tooltip', deprecated(DevToolbarTooltip));
	customElements.define('astro-dev-overlay-highlight', deprecated(DevToolbarHighlight));
	customElements.define('astro-dev-overlay-card', deprecated(DevToolbarCard));
	customElements.define('astro-dev-overlay-toggle', deprecated(DevToolbarToggle));
	customElements.define('astro-dev-overlay-button', deprecated(DevToolbarButton));
	customElements.define('astro-dev-overlay-badge', deprecated(DevToolbarBadge));
	customElements.define('astro-dev-overlay-icon', deprecated(DevToolbarIcon));

	overlay = document.createElement('astro-dev-toolbar');

	const prepareApp = (appDefinition: DevToolbarAppDefinition, builtIn: boolean): DevToolbarApp => {
		const eventTarget = new EventTarget();
		const app = {
			...appDefinition,
			builtIn: builtIn,
			active: false,
			status: 'loading' as const,
			notification: { state: false },
			eventTarget: eventTarget,
		};

		// Events apps can send to the overlay to update their status
		eventTarget.addEventListener('toggle-notification', (evt) => {
			const target = overlay.shadowRoot?.querySelector(`[data-app-id="${app.id}"]`);
			if (!target) return;

			let newState = true;
			if (evt instanceof CustomEvent) {
				newState = evt.detail.state ?? true;
			}

			app.notification.state = newState;

			target.querySelector('.notification')?.toggleAttribute('data-active', newState);
		});

		const onToggleApp = async (evt: Event) => {
			let newState = undefined;
			if (evt instanceof CustomEvent) {
				newState = evt.detail.state ?? true;
			}

			await overlay.setAppStatus(app, newState);
		};

		eventTarget.addEventListener('toggle-app', onToggleApp);
		// Deprecated
		// TODO: Remove in Astro 5.0
		eventTarget.addEventListener('toggle-plugin', onToggleApp);

		return app;
	};

	const astroMoreApp = {
		id: 'astro:more',
		name: 'More',
		icon: 'dots-three',
		init(canvas, eventTarget) {
			const hiddenApps = apps.filter((p) => !p.builtIn).slice(overlay.customAppsToShow);

			createDropdown();

			document.addEventListener('astro:after-swap', createDropdown);

			function createDropdown() {
				const style = document.createElement('style');
				style.innerHTML = `
					#dropdown {
						background: rgba(19, 21, 26, 1);
						border: 1px solid rgba(52, 56, 65, 1);
						border-radius: 12px;
						box-shadow: 0px 0px 0px 0px rgba(19, 21, 26, 0.30), 0px 1px 2px 0px rgba(19, 21, 26, 0.29), 0px 4px 4px 0px rgba(19, 21, 26, 0.26), 0px 10px 6px 0px rgba(19, 21, 26, 0.15), 0px 17px 7px 0px rgba(19, 21, 26, 0.04), 0px 26px 7px 0px rgba(19, 21, 26, 0.01);
						width: 192px;
						padding: 8px;
						z-index: 2000000010;
						transform: translate(-50%, 0%);
						position: fixed;
						bottom: 72px;
						left: 50%;
					}

					.notification {
						display: none;
						position: absolute;
						top: -4px;
						right: -6px;
						width: 8px;
						height: 8px;
						border-radius: 9999px;
						border: 1px solid rgba(19, 21, 26, 1);
						background: #B33E66;
					}

					#dropdown:not([data-no-notification]) .notification[data-active] {
						display: block;
					}

					#dropdown button {
						border: 0;
						background: transparent;
						color: white;
						font-family: system-ui, sans-serif;
						font-size: 14px;
						white-space: nowrap;
						text-decoration: none;
						margin: 0;
						display: flex;
						align-items: center;
						width: 100%;
						padding: 8px;
						border-radius: 8px;
					}

					#dropdown button:hover, #dropdown button:focus-visible {
						background: #FFFFFF20;
						cursor: pointer;
					}

					#dropdown button.active {
						background: rgba(71, 78, 94, 1);
					}

					#dropdown .icon {
						position: relative;
						height: 20px;
						width: 20px;
						padding: 1px;
						margin-right: 0.5em;
					}

					#dropdown .icon svg {
						max-height: 100%;
						max-width: 100%;
					}
				`;
				canvas.append(style);

				const dropdown = document.createElement('div');
				dropdown.id = 'dropdown';
				dropdown.toggleAttribute('data-no-notification', settings.config.disableAppNotification);

				for (const app of hiddenApps) {
					const buttonContainer = document.createElement('div');
					buttonContainer.classList.add('item');
					const button = document.createElement('button');
					button.setAttribute('data-app-id', app.id);

					const iconContainer = document.createElement('div');
					const iconElement = document.createElement('template');
					iconElement.innerHTML = app.icon ? getAppIcon(app.icon) : '?';
					iconContainer.append(iconElement.content.cloneNode(true));

					const notification = document.createElement('div');
					notification.classList.add('notification');
					iconContainer.append(notification);
					iconContainer.classList.add('icon');

					button.append(iconContainer);
					button.append(document.createTextNode(app.name));

					button.addEventListener('click', () => {
						overlay.toggleAppStatus(app);
					});
					buttonContainer.append(button);

					dropdown.append(buttonContainer);

					app.eventTarget.addEventListener('toggle-notification', (evt) => {
						if (!(evt instanceof CustomEvent)) return;

						notification.toggleAttribute('data-active', evt.detail.state ?? true);

						eventTarget.dispatchEvent(
							new CustomEvent('toggle-notification', {
								detail: {
									state: hiddenApps.some((p) => p.notification.state === true),
								},
							})
						);
					});
				}

				canvas.append(dropdown);
			}
		},
	} satisfies DevToolbarAppDefinition;

	const apps: DevToolbarApp[] = [
		...[astroDevToolApp, astroXrayApp, astroAuditApp, astroSettingsApp, astroMoreApp].map(
			(appDef) => prepareApp(appDef, true)
		),
		...customAppsDefinitions.map((appDef) => prepareApp(appDef, false)),
	];

	overlay.apps = apps;

	document.body.append(overlay);

	document.addEventListener('astro:after-swap', () => {
		document.body.append(overlay);
	});
});
