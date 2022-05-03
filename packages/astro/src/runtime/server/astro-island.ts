/*
customElements.define('astro-island', class extends HTMLElement {
	async connectedCallback(){
		const [ { default: setup } ] = await Promise.all([
			import(this.getAttribute('directive-url')),
			import(this.getAttribute('before-hydration-url'))
		]);

		const opts = JSON.parse(this.getAttribute('opts'));
		setup(this, opts, async () => {
			const propsStr = this.getAttribute('props');
			const props = propsStr ? JSON.parse(propsStr) : {};
			const rendererUrl = this.getAttribute('renderer-url');
			const [
				{ default: Component },
				{ default: hydrate }
			] = await Promise.all([
				import(this.getAttribute('component-url')),
				rendererUrl ? import(rendererUrl) : () => () => {}
			]);

			return (el, children) => hydrate(el)(Component, props, children);
		});
	}
});
*/

/**
 * This is a minified version of the above. If you modify the above you need to
 * copy/paste it into a .js file and then run:
 * > node_modules/.bin/terser --mangle --compress -- file.js
 *
 * And copy/paste the result below
 */
export const islandScript = `customElements.define("astro-island",class extends HTMLElement{async connectedCallback(){const[{default:t}]=await Promise.all([import(this.getAttribute("directive-url")),import(this.getAttribute("before-hydration-url"))]);const e=JSON.parse(this.getAttribute("opts"));t(this,e,(async()=>{const t=this.getAttribute("props");const e=t?JSON.parse(t):{};const r=this.getAttribute("renderer-url");const[{default:s},{default:i}]=await Promise.all([import(this.getAttribute("component-url")),r?import(r):()=>()=>{}]);return(t,r)=>i(t)(s,e,r)}))}});`;
