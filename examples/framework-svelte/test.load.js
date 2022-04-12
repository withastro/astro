import {
  Fragment,
  render as $$render,
  createAstro as $$createAstro,
  createComponent as $$createComponent,
  renderComponent as $$renderComponent,
  unescapeHTML as $$unescapeHTML,
  renderSlot as $$renderSlot,
  addAttribute as $$addAttribute,
  spreadAttributes as $$spreadAttributes,
  defineStyleVars as $$defineStyleVars,
  defineScriptVars as $$defineScriptVars,
  createMetadata as $$createMetadata
} from "/@fs/Users/benholmes/Repositories/astro/packages/astro/dist/runtime/server/index.js";
import "/Users/benholmes/Repositories/astro/examples/framework-svelte/src/pages/index.astro?astro&type=style&index=0&lang.css";
// Component Imports
import Counter from '../components/Counter.svelte';

// Full Astro Component Syntax:
// https://docs.astro.build/core-concepts/astro-components/

import * as $$module1 from '../components/Counter.svelte';

export const $$metadata = $$createMetadata("/src/pages/index.astro", { modules: [{ module: $$module1, specifier: '../components/Counter.svelte', assert: {} }], hydratedComponents: [Counter], clientOnlyComponents: [], hydrationDirectives: new Set(['load']), hoisted: [] });

const $$Astro = $$createAstro("/src/pages/index.astro", 'https://astro.build', 'file:///Users/benholmes/Repositories/astro/examples/framework-svelte/');
const Astro = $$Astro;

//@ts-ignore
const $$Index = $$createComponent(async ($$result, $$props, $$slots) => {
const Astro = $$result.createAstro($$Astro, $$props, $$slots);
Astro.self = $$Index;

const STYLES = [
];
for (const STYLE of STYLES) $$result.styles.add(STYLE);
return $$render`<html lang="en" class="astro-5355JZJE">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<link rel="icon" type="image/x-icon" href="/favicon.ico">
		
	<!--astro:head--></head>
	<body>
		<main class="astro-5355JZJE">
			${$$renderComponent($$result,'Counter',Counter,{"client:load":true,"client:component-hydration":"load","client:component-path":($$metadata.getPath(Counter)),"client:component-export":($$metadata.getExport(Counter)),"class":"astro-5355JZJE"},{"default": () => $$render`<h1 class="astro-5355JZJE">Hello, Svelte!</h1>`,})}
		</main>
	</body></html>`;
});
export default $$Index;

//# sourceMappingURL=data:application/json;charset=utf-8;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL2JlbmhvbG1lcy9SZXBvc2l0b3JpZXMvYXN0cm8vZXhhbXBsZXMvZnJhbWV3b3JrLXN2ZWx0ZS9zcmMvcGFnZXMvaW5kZXguYXN0cm8iXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi0tLVxuLy8gQ29tcG9uZW50IEltcG9ydHNcbmltcG9ydCBDb3VudGVyIGZyb20gJy4uL2NvbXBvbmVudHMvQ291bnRlci5zdmVsdGUnO1xuXG4vLyBGdWxsIEFzdHJvIENvbXBvbmVudCBTeW50YXg6XG4vLyBodHRwczovL2RvY3MuYXN0cm8uYnVpbGQvY29yZS1jb25jZXB0cy9hc3Ryby1jb21wb25lbnRzL1xuLS0tXG5cblx1MDAzY2h0bWwgbGFuZz1cImVuXCJcdTAwM2Vcblx0XHUwMDNjaGVhZFx1MDAzZVxuXHRcdFx1MDAzY21ldGEgY2hhcnNldD1cInV0Zi04XCIgL1x1MDAzZVxuXHRcdFx1MDAzY21ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aFwiIC9cdTAwM2Vcblx0XHRcdTAwM2NsaW5rIHJlbD1cImljb25cIiB0eXBlPVwiaW1hZ2UveC1pY29uXCIgaHJlZj1cIi9mYXZpY29uLmljb1wiIC9cdTAwM2Vcblx0XHRcdTAwM2NzdHlsZVx1MDAzZVxuXHRcdFx0aHRtbCxcblx0XHRcdGJvZHkge1xuXHRcdFx0XHRmb250LWZhbWlseTogc3lzdGVtLXVpO1xuXHRcdFx0XHRtYXJnaW46IDA7XG5cdFx0XHR9XG5cdFx0XHRib2R5IHtcblx0XHRcdFx0cGFkZGluZzogMnJlbTtcblx0XHRcdH1cblx0XHRcdTAwM2Mvc3R5bGVcdTAwM2Vcblx0XHUwMDNjL2hlYWRcdTAwM2Vcblx0XHUwMDNjYm9keVx1MDAzZVxuXHRcdFx1MDAzY21haW5cdTAwM2Vcblx0XHRcdFx1MDAzY0NvdW50ZXIgY2xpZW50OmxvYWRcdTAwM2Vcblx0XHRcdFx0XHUwMDNjaDFcdTAwM2VIZWxsbywgU3ZlbHRlIVx1MDAzYy9oMVx1MDAzZVxuXHRcdFx0XHUwMDNjL0NvdW50ZXJcdTAwM2Vcblx0XHRcdTAwM2MvbWFpblx1MDAzZVxuXHRcdTAwM2MvYm9keVx1MDAzZVxuXHUwMDNjL2h0bWxcdTAwM2VcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLEFBQUc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQU1BO0FBQUE7QUFBQTtBQU5BO0FBQUEsZ0JBUUMsQ0FBQyxJQUFELENBQUssS0FBTSxJQUFYLENBUkQsc0JBUUMsQ0FBZTtBQUFBLENBQ2QsQ0FBQyxJQUFELENBQUs7QUFBQSxFQUNKLENBQUMsSUFBRCxDQUFLLFFBQVMsT0FBZCxDQUF1QjtBQUFBLEVBQ3ZCLENBQUMsSUFBRCxDQUFLLEtBQU0sVUFBWCxDQUFxQixRQUFTLG9CQUE5QixDQUFvRDtBQUFBLEVBQ3BELENBQUMsSUFBRCxDQUFLLElBQUssTUFBVixDQUFnQixLQUFNLGNBQXRCLENBQW9DLEtBQU0sY0FBMUMsQ0FBMEQ7QUFBQSxFQVVuRDtBQUFBLENBQ1AsQUF2Qkgsd0JBdUJRO0FBQUEsQ0FDTixDQUFDLElBQUQsQ0FBSztBQUFBLEVBQ0osQ0FBQyxJQUFELENBekJILHNCQXlCRyxDQUFLO0FBQUEsR0FDSix1Q0FBQyxPQUFELEVBQVEsbUJBMUJaLHlNQTJCSyxDQUFDLEVBQUQsQ0EzQkwsc0JBMkJLLENBQUcsY0FBZ0IsS0EzQnhCLEdBNEJLLEVBQVE7QUFBQSxFQUNULE9BQUs7QUFBQSxDQUNOLE9BOUJIO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0=