import { serverHelpers } from './helpers.js';
import { settings } from './settings.js';
import { getIconElement, isDefinedIcon } from './ui-library/icons.js';
const WS_EVENT_NAME = 'astro-dev-toolbar';
const HOVER_DELAY = 2 * 1e3;
const DEVBAR_HITBOX_ABOVE = 42;
class AstroDevToolbar extends HTMLElement {
	shadowRoot;
	delayedHideTimeout;
	devToolbarContainer;
	apps = [];
	hasBeenInitialized = false;
	// TODO: This should be dynamic based on the screen size or at least configurable, erika - 2023-11-29
	customAppsToShow = 3;
	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });
	}
	/**
	 * All one-time DOM setup runs through here. Only ever call this once,
	 * in connectedCallback(), and protect it from being called again.
	 */
	init() {
		this.shadowRoot.innerHTML = `
		<style>
			:host {
				/* Important! Reset all inherited styles to initial */
				all: initial;
				z-index: 999999;
				view-transition-name: astro-dev-toolbar;
				display: contents;

				/* Hide the dev toolbar on window.print() (CTRL + P) */
				@media print {
					display: none;
				}
			}

			::view-transition-old(astro-dev-toolbar),
			::view-transition-new(astro-dev-toolbar) {
				animation: none;
			}

			#dev-toolbar-root {
				position: fixed;
				bottom: 0px;
				z-index: 2000000010;
				display: flex;
				flex-direction: column;
				align-items: center;
				transition: bottom 0.35s cubic-bezier(0.485, -0.050, 0.285, 1.505);
				pointer-events: none;
			}

			#dev-toolbar-root[data-hidden] {
				bottom: -40px;
			}

			#dev-toolbar-root[data-hidden] #dev-bar .item {
				opacity: 0.2;
			}

			#dev-toolbar-root[data-placement="bottom-left"] {
				left: 16px;
			}
			#dev-toolbar-root[data-placement="bottom-center"] {
				left: 50%;
				transform: translateX(-50%);
			}
			#dev-toolbar-root[data-placement="bottom-right"] {
				right: 16px;
			}

			#dev-bar-hitbox-above,
			#dev-bar-hitbox-below {
				width: 100%;
				pointer-events: auto;
			}
			#dev-bar-hitbox-above {
				height: ${DEVBAR_HITBOX_ABOVE}px;
			}
			#dev-bar-hitbox-below {
				height: 16px;
			}
			#dev-bar {
				height: 40px;
				overflow: hidden;
				pointer-events: auto;
				background: linear-gradient(180deg, #13151A 0%, rgba(19, 21, 26, 0.88) 100%);
				border: 1px solid #343841;
				border-radius: 9999px;
				box-shadow: 0px 0px 0px 0px rgba(19, 21, 26, 0.30), 0px 1px 2px 0px rgba(19, 21, 26, 0.29), 0px 4px 4px 0px rgba(19, 21, 26, 0.26), 0px 10px 6px 0px rgba(19, 21, 26, 0.15), 0px 17px 7px 0px rgba(19, 21, 26, 0.04), 0px 26px 7px 0px rgba(19, 21, 26, 0.01);
			}

			@media (forced-colors: active) {
				#dev-bar {
					background: white;
				}
			}

			#dev-bar .item {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 44px;
				border: 0;
				background: transparent;
				color: white;
				font-family: system-ui, sans-serif;
				font-size: 1rem;
				line-height: 1.2;
				white-space: nowrap;
				text-decoration: none;
				padding: 0;
				margin: 0;
				overflow: hidden;
				transition: opacity 0.2s ease-out 0s;
			}

			#dev-bar #bar-container .item:hover, #dev-bar #bar-container .item:focus-visible {
				background: #FFFFFF20;
				cursor: pointer;
				outline-offset: -3px;
			}

			#dev-bar #bar-container .item[data-app-error]:hover, #dev-bar #bar-container .item[data-app-error]:focus-visible {
				cursor: not-allowed;
				background: #ff252520;
			}

			#dev-bar .item:first-of-type {
				border-top-left-radius: 9999px;
				border-bottom-left-radius: 9999px;
				width: 42px;
				padding-left: 4px;
			}

			#dev-bar .item:last-of-type {
				border-top-right-radius: 9999px;
				border-bottom-right-radius: 9999px;
				width: 42px;
				padding-right: 4px;
			}
			#dev-bar #bar-container .item.active {
				background: rgba(71, 78, 94, 1);
			}

			#dev-bar .item-tooltip {
				background: linear-gradient(0deg, #13151A, #13151A), linear-gradient(0deg, #343841, #343841);
				border: 1px solid rgba(52, 56, 65, 1);
				border-radius: 4px;
				padding: 4px 8px;
				position: absolute;
				top: ${4 - DEVBAR_HITBOX_ABOVE}px;
				font-size: 14px;
				opacity: 0;
				transition: opacity 0.2s ease-in-out 0s;
				pointer-events: none;
				user-select: none;
			}

			#dev-bar .item-tooltip::after{
				content: '';
				position: absolute;
				left: calc(50% - 5px);
				bottom: -6px;
				border-left: 5px solid transparent;
				border-right: 5px solid transparent;
				border-top: 5px solid #343841;
			}

			#dev-bar .item[data-app-error] .icon {
				opacity: 0.35;
			}

			#dev-bar .item:hover .item-tooltip, #dev-bar .item:not(.active):focus-visible .item-tooltip {
				transition: opacity 0.2s ease-in-out 200ms;
				opacity: 1;
			}

			@media (forced-colors: active) {
				#dev-bar .item:hover .item-tooltip,
				#dev-bar .item:not(.active):focus-visible .item-tooltip {
					background: white;
				}
			}

			#dev-bar #bar-container .item:hover .notification rect, #dev-bar #bar-container .item:hover .notification path {
				stroke: #38393D;
				--fill: var(--fill-hover);
			}

			#dev-bar #bar-container .item.active .notification rect, #dev-bar #bar-container .item.active .notification path {
				stroke: #454C5C;
				--fill: var(--fill-hover);
			}

			#dev-bar .item .icon {
				position: relative;
				max-width: 20px;
				max-height: 20px;
				user-select: none;
			}

			#dev-bar .item .icon>svg {
				width: 20px;
				height: 20px;
				display: block;
				margin: auto;
			}

			@media (forced-colors: active) {
				#dev-bar .item svg path[fill="#fff"] {
					fill: black;
				}
			}

			#dev-bar .item .notification {
				display: none;
				position: absolute;
				top: -4px;
				right: -6px;
				width: 10px;
				height: 10px;
			}

			#dev-bar .item .notification svg {
				display: block;
			}

			#dev-toolbar-root:not([data-no-notification]) #dev-bar .item .notification[data-active] {
				display: block;
			}

			#dev-bar #bar-container {
				height: 100%;
				display: flex;
			}

			#dev-bar .separator {
				background: rgba(52, 56, 65, 1);
				width: 1px;
			}
		</style>
		<div id="dev-toolbar-root" data-hidden ${settings.config.disableAppNotification ? 'data-no-notification' : ''} data-placement="${settings.config.placement}">
			<div id="dev-bar-hitbox-above"></div>
			<div id="dev-bar">
				<div id="bar-container">
					${this.apps
						.filter((app) => app.builtIn && !['astro:settings', 'astro:more'].includes(app.id))
						.map((app) => this.getAppTemplate(app))
						.join('')}
					${
						this.apps.filter((app) => !app.builtIn).length > 0
							? `<div class="separator"></div>${this.apps
									.filter((app) => !app.builtIn)
									.slice(0, this.customAppsToShow)
									.map((app) => this.getAppTemplate(app))
									.join('')}`
							: ''
					}
					${
						this.apps.filter((app) => !app.builtIn).length > this.customAppsToShow
							? this.getAppTemplate(this.apps.find((app) => app.builtIn && app.id === 'astro:more'))
							: ''
					}
					<div class="separator"></div>
					${this.getAppTemplate(this.apps.find((app) => app.builtIn && app.id === 'astro:settings'))}
				</div>
			</div>
			<div id="dev-bar-hitbox-below"></div>
		</div>`;
		this.devToolbarContainer = this.shadowRoot.querySelector('#dev-toolbar-root');
		this.attachEvents();
		this.apps.forEach(async (app) => {
			settings.logger.verboseLog(`Creating app canvas for ${app.id}`);
			const appCanvas = document.createElement('astro-dev-toolbar-app-canvas');
			appCanvas.dataset.appId = app.id;
			this.shadowRoot?.append(appCanvas);
		});
		if ('requestIdleCallback' in window) {
			window.requestIdleCallback(
				async () => {
					this.apps.map((app) => this.initApp(app));
				},
				{ timeout: 300 },
			);
		} else {
			setTimeout(async () => {
				this.apps.map((app) => this.initApp(app));
			}, 300);
		}
	}
	// This is called whenever the component is connected to the DOM.
	// This happens on first page load, and on each page change when
	// view transitions are used.
	connectedCallback() {
		if (!this.hasBeenInitialized) {
			this.init();
			this.hasBeenInitialized = true;
		}
		this.apps.forEach(async (app) => {
			await this.setAppStatus(app, app.active);
		});
	}
	attachEvents() {
		const items = this.shadowRoot.querySelectorAll('.item');
		items.forEach((item) => {
			item.addEventListener('click', async (event) => {
				const target = event.currentTarget;
				if (!target || !(target instanceof HTMLElement)) return;
				const id = target.dataset.appId;
				if (!id) return;
				const app = this.getAppById(id);
				if (!app) return;
				event.stopPropagation();
				await this.toggleAppStatus(app);
			});
		});
		['mouseenter', 'focusin'].forEach((event) => {
			this.devToolbarContainer.addEventListener(event, () => {
				this.clearDelayedHide();
				if (this.isHidden()) {
					this.setToolbarVisible(true);
				}
			});
		});
		['mouseleave', 'focusout'].forEach((event) => {
			this.devToolbarContainer.addEventListener(event, () => {
				this.clearDelayedHide();
				if (this.getActiveApp() || this.isHidden()) {
					return;
				}
				this.triggerDelayedHide();
			});
		});
		document.addEventListener('keyup', (event) => {
			if (event.key !== 'Escape') return;
			if (this.isHidden()) return;
			const activeApp = this.getActiveApp();
			if (activeApp) {
				this.toggleAppStatus(activeApp);
			} else {
				this.setToolbarVisible(false);
			}
		});
	}
	async initApp(app) {
		const shadowRoot = this.getAppCanvasById(app.id).shadowRoot;
		app.status = 'loading';
		try {
			settings.logger.verboseLog(`Initializing app ${app.id}`);
			await app.init?.(shadowRoot, app.eventTarget, serverHelpers);
			app.status = 'ready';
			if (import.meta.hot) {
				import.meta.hot.send(`${WS_EVENT_NAME}:${app.id}:initialized`);
			}
		} catch (e) {
			console.error(`Failed to init app ${app.id}, error: ${e}`);
			app.status = 'error';
			if (import.meta.hot) {
				import.meta.hot.send('astro:devtoolbar:error:init', {
					app,
					error: e instanceof Error ? e.stack : e,
				});
			}
			const appButton = this.getAppButtonById(app.id);
			const appTooltip = appButton?.querySelector('.item-tooltip');
			if (appButton && appTooltip) {
				appButton.toggleAttribute('data-app-error', true);
				appTooltip.innerText = `Error initializing ${app.name}`;
			}
		}
	}
	getAppTemplate(app) {
		return `<button class="item" data-app-id="${app.id}">
				<div class="icon">${app.icon ? getAppIcon(app.icon) : '?'}<div class="notification"></div></div>
				<span class="item-tooltip">${app.name}</span>
			</button>`;
	}
	getAppById(id) {
		return this.apps.find((app) => app.id === id);
	}
	getAppCanvasById(id) {
		return this.shadowRoot.querySelector(`astro-dev-toolbar-app-canvas[data-app-id="${id}"]`);
	}
	getAppButtonById(id) {
		return this.shadowRoot.querySelector(`[data-app-id="${id}"]`);
	}
	async toggleAppStatus(app) {
		const activeApp = this.getActiveApp();
		if (activeApp) {
			const closeApp = await this.setAppStatus(activeApp, false);
			if (!closeApp) return;
		}
		if (app.status !== 'ready') return;
		if (app !== activeApp) {
			await this.setAppStatus(app, true);
			if (import.meta.hot && app.id !== 'astro:more') {
				import.meta.hot.send('astro:devtoolbar:app:toggled', {
					app,
				});
			}
		}
	}
	async setAppStatus(app, newStatus) {
		const appCanvas = this.getAppCanvasById(app.id);
		if (!appCanvas) return false;
		if (app.active && !newStatus && app.beforeTogglingOff) {
			const shouldToggleOff = await app.beforeTogglingOff(appCanvas.shadowRoot);
			if (!shouldToggleOff) return false;
		}
		app.active = newStatus ?? !app.active;
		const mainBarButton = this.getAppButtonById(app.id);
		const moreBarButton = this.getAppCanvasById('astro:more')?.shadowRoot?.querySelector(
			`[data-app-id="${app.id}"]`,
		);
		if (mainBarButton) {
			mainBarButton.classList.toggle('active', app.active);
		}
		if (moreBarButton) {
			moreBarButton.classList.toggle('active', app.active);
		}
		if (app.active) {
			appCanvas.style.display = 'block';
			appCanvas.setAttribute('data-active', '');
		} else {
			appCanvas.style.display = 'none';
			appCanvas.removeAttribute('data-active');
		}
		app.eventTarget.dispatchEvent(
			new CustomEvent('app-toggled', {
				detail: {
					state: app.active,
					app,
				},
			}),
		);
		import.meta.hot?.send(`${WS_EVENT_NAME}:${app.id}:toggled`, { state: app.active });
		return true;
	}
	isHidden() {
		return this.devToolbarContainer?.hasAttribute('data-hidden') ?? true;
	}
	getActiveApp() {
		return this.apps.find((app) => app.active);
	}
	clearDelayedHide() {
		window.clearTimeout(this.delayedHideTimeout);
		this.delayedHideTimeout = void 0;
	}
	triggerDelayedHide() {
		this.clearDelayedHide();
		this.delayedHideTimeout = window.setTimeout(() => {
			this.setToolbarVisible(false);
			this.delayedHideTimeout = void 0;
		}, HOVER_DELAY);
	}
	setToolbarVisible(newStatus) {
		const barContainer = this.shadowRoot.querySelector('#bar-container');
		const devBar = this.shadowRoot.querySelector('#dev-bar');
		const devBarHitboxAbove = this.shadowRoot.querySelector('#dev-bar-hitbox-above');
		if (newStatus === true) {
			this.devToolbarContainer?.removeAttribute('data-hidden');
			barContainer?.removeAttribute('inert');
			devBar?.removeAttribute('tabindex');
			if (devBarHitboxAbove) devBarHitboxAbove.style.height = '0';
			return;
		}
		if (newStatus === false) {
			this.devToolbarContainer?.setAttribute('data-hidden', '');
			barContainer?.setAttribute('inert', '');
			devBar?.setAttribute('tabindex', '0');
			if (devBarHitboxAbove) devBarHitboxAbove.style.height = `${DEVBAR_HITBOX_ABOVE}px`;
			return;
		}
	}
	setNotificationVisible(newStatus) {
		this.devToolbarContainer?.toggleAttribute('data-no-notification', !newStatus);
		const moreCanvas = this.getAppCanvasById('astro:more');
		moreCanvas?.shadowRoot
			?.querySelector('#dropdown')
			?.toggleAttribute('data-no-notification', !newStatus);
	}
	setToolbarPlacement(newPlacement) {
		this.devToolbarContainer?.setAttribute('data-placement', newPlacement);
		this.apps.forEach((app) => {
			app.eventTarget.dispatchEvent(
				new CustomEvent('placement-updated', {
					detail: {
						placement: newPlacement,
					},
				}),
			);
		});
	}
}
class DevToolbarCanvas extends HTMLElement {
	shadowRoot;
	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });
	}
	connectedCallback() {
		this.shadowRoot.innerHTML = `
		<style>
			:host {
				position: absolute;
				top: 0;
				left: 0;
			}
		</style>`;
	}
}
function getAppIcon(icon) {
	if (isDefinedIcon(icon)) {
		return getIconElement(icon).outerHTML;
	}
	return icon;
}
export { AstroDevToolbar, DevToolbarCanvas, getAppIcon };
