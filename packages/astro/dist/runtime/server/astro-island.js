const FORBIDDEN_COMPONENT_EXPORT_KEYS = /* @__PURE__ */ new Set([
	'__proto__',
	'constructor',
	'prototype',
]);
{
	const propTypes = {
		0: (value) => reviveObject(value),
		1: (value) => reviveArray(value),
		// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
		// Regex props are serialized by Astro and revived here on the client.
		2: (value) => new RegExp(value),
		3: (value) => new Date(value),
		4: (value) => new Map(reviveArray(value)),
		5: (value) => new Set(reviveArray(value)),
		6: (value) => BigInt(value),
		7: (value) => new URL(value),
		8: (value) => new Uint8Array(value),
		9: (value) => new Uint16Array(value),
		10: (value) => new Uint32Array(value),
		11: (value) => Number.POSITIVE_INFINITY * value,
	};
	const reviveTuple = (raw) => {
		const [type, value] = raw;
		return type in propTypes ? propTypes[type](value) : void 0;
	};
	const reviveArray = (raw) => raw.map(reviveTuple);
	const reviveObject = (raw) => {
		if (typeof raw !== 'object' || raw === null) return raw;
		return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, reviveTuple(value)]));
	};
	class AstroIsland extends HTMLElement {
		Component;
		hydrator;
		static observedAttributes = ['props'];
		disconnectedCallback() {
			document.removeEventListener('astro:after-swap', this.unmount);
			document.addEventListener('astro:after-swap', this.unmount, { once: true });
		}
		connectedCallback() {
			if (
				!this.hasAttribute('await-children') ||
				document.readyState === 'interactive' ||
				document.readyState === 'complete'
			) {
				this.childrenConnectedCallback();
			} else {
				const onConnected = () => {
					document.removeEventListener('DOMContentLoaded', onConnected);
					mo.disconnect();
					this.childrenConnectedCallback();
				};
				const mo = new MutationObserver(() => {
					if (
						this.lastChild?.nodeType === Node.COMMENT_NODE &&
						this.lastChild.nodeValue === 'astro:end'
					) {
						this.lastChild.remove();
						onConnected();
					}
				});
				mo.observe(this, { childList: true });
				document.addEventListener('DOMContentLoaded', onConnected);
			}
		}
		async childrenConnectedCallback() {
			let beforeHydrationUrl = this.getAttribute('before-hydration-url');
			if (beforeHydrationUrl) {
				await import(beforeHydrationUrl);
			}
			this.start();
		}
		getRetryImportUrl(url) {
			const parsed = new URL(url, document.baseURI);
			const retryToken = `astro-retry=${Date.now()}`;
			const currentHash = parsed.hash.replace(/^#/, '');
			parsed.hash = currentHash ? `${currentHash}&${retryToken}` : retryToken;
			return parsed.toString();
		}
		async importWithRetry(url) {
			try {
				return await import(url);
			} catch {
				await new Promise((resolve) => setTimeout(resolve, 1e3));
				return import(this.getRetryImportUrl(url));
			}
		}
		handleHydrationError(error) {
			const componentUrl = this.getAttribute('component-url');
			const event = new CustomEvent('astro:hydration-error', {
				cancelable: true,
				bubbles: true,
				composed: true,
				detail: {
					error,
					componentUrl,
				},
			});
			const shouldLogError = this.dispatchEvent(event);
			if (shouldLogError) {
				console.error(`[astro-island] Error hydrating ${componentUrl}`, error);
			}
		}
		async start() {
			const opts = JSON.parse(this.getAttribute('opts'));
			const directive = this.getAttribute('client');
			if (Astro[directive] === void 0) {
				window.addEventListener(`astro:${directive}`, () => this.start(), { once: true });
				return;
			}
			try {
				await Astro[directive](
					async () => {
						const rendererUrl = this.getAttribute('renderer-url');
						try {
							const [componentModule, { default: hydrator }] = await Promise.all([
								this.importWithRetry(this.getAttribute('component-url')),
								rendererUrl
									? this.importWithRetry(rendererUrl)
									: Promise.resolve({ default: () => () => {} }),
							]);
							const componentExport = this.getAttribute('component-export') || 'default';
							if (!componentExport.includes('.')) {
								if (FORBIDDEN_COMPONENT_EXPORT_KEYS.has(componentExport)) {
									throw new Error(`Invalid component export path: ${componentExport}`);
								}
								this.Component = componentModule[componentExport];
							} else {
								this.Component = componentModule;
								for (const part of componentExport.split('.')) {
									if (
										FORBIDDEN_COMPONENT_EXPORT_KEYS.has(part) ||
										!this.Component ||
										(typeof this.Component !== 'object' && typeof this.Component !== 'function') ||
										!Object.hasOwn(this.Component, part)
									) {
										throw new Error(`Invalid component export path: ${componentExport}`);
									}
									this.Component = this.Component[part];
								}
							}
							this.hydrator = hydrator;
							return this.hydrate;
						} catch (error) {
							this.handleHydrationError(error);
							return () => {};
						}
					},
					opts,
					this,
				);
			} catch (error) {
				this.handleHydrationError(error);
			}
		}
		hydrate = async () => {
			if (!this.hydrator) return;
			if (!this.isConnected) return;
			const parentSsrIsland = this.parentElement?.closest('astro-island[ssr]');
			if (parentSsrIsland) {
				parentSsrIsland.addEventListener('astro:hydrate', this.hydrate, { once: true });
				return;
			}
			const slotted = this.querySelectorAll('astro-slot');
			const slots = {};
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
			let props;
			try {
				props = this.hasAttribute('props')
					? reviveObject(JSON.parse(this.getAttribute('props')))
					: {};
			} catch (e) {
				let componentName = this.getAttribute('component-url') || '<unknown>';
				const componentExport = this.getAttribute('component-export');
				if (componentExport) {
					componentName += ` (export ${componentExport})`;
				}
				console.error(
					`[hydrate] Error parsing props for component ${componentName}`,
					this.getAttribute('props'),
					e,
				);
				throw e;
			}
			let hydrationTimeStart;
			const hydrator = this.hydrator(this);
			if (process.env.NODE_ENV === 'development') hydrationTimeStart = performance.now();
			await hydrator(this.Component, props, slots, {
				client: this.getAttribute('client'),
			});
			if (process.env.NODE_ENV === 'development' && hydrationTimeStart)
				this.setAttribute(
					'client-render-time',
					(performance.now() - hydrationTimeStart).toString(),
				);
			this.removeAttribute('ssr');
			this.dispatchEvent(new CustomEvent('astro:hydrate'));
		};
		attributeChangedCallback() {
			this.hydrate();
		}
		unmount = () => {
			if (!this.isConnected) this.dispatchEvent(new CustomEvent('astro:unmount'));
		};
	}
	if (!customElements.get('astro-island')) {
		customElements.define('astro-island', AstroIsland);
	}
}
