// Note that this file is prebuilt to astro-island.prebuilt.ts
// Do not import this file directly, instead import the prebuilt one instead.

{
	interface PropTypeSelector {
		[k: string]: (value: any) => any;
	}

	const propTypes: PropTypeSelector = {
		0: value => value,
		1: value => JSON.parse(value, reviver),
		2: value => new RegExp(value),
		3: value => new Date(value),
		4: value => new Map(JSON.parse(value, reviver)),
		5: value => new Set(JSON.parse(value, reviver)),
		6: value => BigInt(value),
		7: value => new URL(value),
	};

	const reviver = (propKey: string, raw: string): any => {
		if(propKey === '' || !Array.isArray(raw)) return raw;
		const [type, value] = raw;
		return (type in propTypes) ? propTypes[type](value) : undefined;
	};

	customElements.define('astro-island', class extends HTMLElement {
		async connectedCallback(){
			const [ { default: setup } ] = await Promise.all([
				import(this.getAttribute('directive-url')!),
				import(this.getAttribute('before-hydration-url')!)
			]);
			const opts = JSON.parse(this.getAttribute('opts')!);
			setup(this, opts, async () => {
				const props = this.hasAttribute('props') ? JSON.parse(this.getAttribute('props')!, reviver) : {};
				const rendererUrl = this.getAttribute('renderer-url');
				const [
					componentModule,
					{ default: hydrate }
				] = await Promise.all([
					import(this.getAttribute('component-url')!),
					rendererUrl ? import(rendererUrl) : () => () => {}
				]);
				const Component = componentModule[this.getAttribute('component-export') || 'default'];
				return (el: HTMLElement, children: string) => hydrate(el)(Component, props, children, { client: this.getAttribute('client') });
			});
		}
	});
}
