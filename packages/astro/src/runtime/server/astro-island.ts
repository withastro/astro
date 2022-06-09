/*
{
	const propTypes = {
		0: value => value,
		1: value => JSON.parse(value, reviver),
		2: value => new RegExp(value),
		3: value => new Date(value),
		4: value => new Map(JSON.parse(value, reviver)),
		5: value => new Set(JSON.parse(value, reviver)),
		6: value => BigInt(value),
		7: value => new URL(value),
	};

	const reviver = (propKey, raw) => {
		if(propKey === '' || !Array.isArray(raw)) return raw;
		const [type, value] = raw;
		return (type in propTypes) ? propTypes[type](value) : undefined;
	};

	customElements.define('astro-island', class extends HTMLElement {
		async connectedCallback(){
			const [ { default: setup } ] = await Promise.all([
				import(this.getAttribute('directive-url')),
				import(this.getAttribute('before-hydration-url'))
			]);
			const opts = JSON.parse(this.getAttribute('opts'));
			setup(this, opts, async () => {
				const props = this.hasAttribute('props') ? JSON.parse(this.getAttribute('props'), reviver) : {};
				const rendererUrl = this.getAttribute('renderer-url');
				const [
					{ default: Component },
					{ default: hydrate }
				] = await Promise.all([
					import(this.getAttribute('component-url')),
					rendererUrl ? import(rendererUrl) : () => () => {}
				]);
				return (el, children) => hydrate(el)(Component, props, children, { client: this.getAttribute('client') });
			});
		}
	});
}
*/

/**
 * This is a minified version of the above. If you modify the above you need to
 * copy/paste it into a .js file and then run:
 * > node_modules/.bin/terser --mangle --compress -- file.js
 * 
 * And copy/paste the result below
 */
export const islandScript = `{const t={0:t=>t,1:t=>JSON.parse(t,e),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(JSON.parse(t,e)),5:t=>new Set(JSON.parse(t,e)),6:t=>BigInt(t),7:t=>new URL(t)},e=(e,r)=>{if(""===e||!Array.isArray(r))return r;const[i,s]=r;return i in t?t[i](s):void 0};customElements.define("astro-island",class extends HTMLElement{async connectedCallback(){const[{default:t}]=await Promise.all([import(this.getAttribute("directive-url")),import(this.getAttribute("before-hydration-url"))]);t(this,JSON.parse(this.getAttribute("opts")),(async()=>{const t=this.hasAttribute("props")?JSON.parse(this.getAttribute("props"),e):{},r=this.getAttribute("renderer-url"),[{default:i},{default:s}]=await Promise.all([import(this.getAttribute("component-url")),r?import(r):()=>()=>{}]);return(e,r)=>s(e)(i,t,r,{client:this.getAttribute("client")})}))}})}`;
