// Note that this file is prebuilt to astro-island.prebuilt.ts
// Do not import this file directly, instead import the prebuilt one instead.
// pnpm --filter astro run prebuild

type directiveAstroKeys = 'load' | 'idle' | 'visible' | 'media' | 'only';

declare const Astro: {
	[k in directiveAstroKeys]?: (
		fn: () => Promise<() => void>,
		opts: Record<string, any>,
		root: HTMLElement
	) => void;
};

{
	interface PropTypeSelector {
		[k: string]: (value: any) => any;
	}

	const propTypes: PropTypeSelector = {
		0: (value) => reviveObject(value),
		1: (value) => reviveArray(value),
		2: (value) => new RegExp(value),
		3: (value) => new Date(value),
		4: (value) => new Map(reviveArray(value)),
		5: (value) => new Set(reviveArray(value)),
		6: (value) => BigInt(value),
		7: (value) => new URL(value),
		8: (value) => new Uint8Array(value),
		9: (value) => new Uint16Array(value),
		10: (value) => new Uint32Array(value),
	};

	// Not using JSON.parse reviver because it's bottom-up but we want top-down
	const reviveTuple = (raw: any): any => {
		const [type, value] = raw;
		return type in propTypes ? propTypes[type](value) : undefined;
	};

	const reviveArray = (raw: any): any => (raw as Array<any>).map(reviveTuple);

	const reviveObject = (raw: any): any => {
		if (typeof raw !== 'object' || raw === null) return raw;
		return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, reviveTuple(value)]));
	};

	if (!customElements.get('astro-island')) {
		customElements.define(
			'astro-island',
			class extends HTMLElement {
				public Component: any;
				public hydrator: any;
				static observedAttributes = ['props'];
				disconnectedCallback() {
					document.addEventListener('astro:after-swap', () => {
						// If element wasn't persisted, fire unmount event
						if (!this.isConnected) this.dispatchEvent(new CustomEvent('astro:unmount'))
					}, { once: true })
				}
				connectedCallback() {
					if (!this.hasAttribute('await-children') || this.firstChild) {
						this.childrenConnectedCallback();
					} else {
						// connectedCallback may run *before* children are rendered (ex. HTML streaming)
						// If SSR children are expected, but not yet rendered,
						// Wait with a mutation observer
						new MutationObserver((_, mo) => {
							mo.disconnect();
							// Wait until the next macrotask to ensure children are really rendered
							setTimeout(() => this.childrenConnectedCallback(), 0);
						}).observe(this, { childList: true });
					}
				}
				async childrenConnectedCallback() {
					let beforeHydrationUrl = this.getAttribute('before-hydration-url');
					if (beforeHydrationUrl) {
						await import(beforeHydrationUrl);
					}
					this.start();
				}
				start() {
					const opts = JSON.parse(this.getAttribute('opts')!) as Record<string, any>;
					const directive = this.getAttribute('client') as directiveAstroKeys;
					if (Astro[directive] === undefined) {
						window.addEventListener(`astro:${directive}`, () => this.start(), { once: true });
						return;
					}
					Astro[directive]!(
						async () => {
							const rendererUrl = this.getAttribute('renderer-url');
							const [componentModule, { default: hydrator }] = await Promise.all([
								import(this.getAttribute('component-url')!),
								rendererUrl ? import(rendererUrl) : () => () => {},
							]);
							const componentExport = this.getAttribute('component-export') || 'default';
							if (!componentExport.includes('.')) {
								this.Component = componentModule[componentExport];
							} else {
								this.Component = componentModule;
								for (const part of componentExport.split('.')) {
									this.Component = this.Component[part];
								}
							}
							this.hydrator = hydrator;
							return this.hydrate;
						},
						opts,
						this
					);
				}
				hydrate = async () => {
					// The client directive needs to load the hydrator code before it can hydrate
					if (!this.hydrator) return;

					// Make sure the island is mounted on the DOM before hydrating. It could be unmounted
					// when the parent island hydrates and re-creates this island.
					if (!this.isConnected) return;

					// Wait for parent island to hydrate first so we hydrate top-down. The `ssr` attribute
					// represents that it has not completed hydration yet.
					const parentSsrIsland = this.parentElement?.closest('astro-island[ssr]');
					if (parentSsrIsland) {
						parentSsrIsland.addEventListener('astro:hydrate', this.hydrate, { once: true });
						return;
					}

					const slotted = this.querySelectorAll('astro-slot');
					const slots: Record<string, string> = {};
					// Always check to see if there are templates.
					// This happens if slots were passed but the client component did not render them.
					const templates = this.querySelectorAll('template[data-astro-template]');
					for (const template of templates) {
						const closest = template.closest(this.tagName);
						if (!closest?.isSameNode(this)) continue;
						slots[template.getAttribute('data-astro-template') || 'default'] = template.innerHTML;
						template.remove();
					}
					for (const slot of slotted) {
						const closest = slot.closest(this.tagName);
						if (!closest?.isSameNode(this)) continue;
						slots[slot.getAttribute('name') || 'default'] = slot.innerHTML;
					}

					let props: Record<string, unknown>;

					try {
						props = this.hasAttribute('props')
							? reviveObject(JSON.parse(this.getAttribute('props')!))
							: {};
					} catch (e) {
						let componentName: string = this.getAttribute('component-url') || '<unknown>';
						const componentExport = this.getAttribute('component-export');

						if (componentExport) {
							componentName += ` (export ${componentExport})`;
						}

						// eslint-disable-next-line no-console
						console.error(
							`[hydrate] Error parsing props for component ${componentName}`,
							this.getAttribute('props'),
							e
						);
						throw e;
					}
					await this.hydrator(this)(this.Component, props, slots, {
						client: this.getAttribute('client'),
					});
					this.removeAttribute('ssr');
					this.dispatchEvent(new CustomEvent('astro:hydrate'));
				};
				attributeChangedCallback() {
					this.hydrate();
				}
			}
		);
	}
}
