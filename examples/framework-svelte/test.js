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

export const $$metadata = $$createMetadata("/src/pages/index.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: ['../components/Counter.svelte'], hydrationDirectives: new Set(['only']), hoisted: [] });

const $$Astro = $$createAstro("/src/pages/index.astro", 'https://astro.build', 'file:///Users/benholmes/Repositories/astro/examples/framework-svelte/');
const Astro = $$Astro;

//@ts-ignore
const $$Index = $$createComponent(async ($$result, $$props, $$slots) => {
const Astro = $$result.createAstro($$Astro, $$props, $$slots);
Astro.self = $$Index;

const STYLES = [
];
for (const STYLE of STYLES) $$result.styles.add(STYLE);
return $$render`<html lang="en" class="astro-EVQ4BTHH">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<link rel="icon" type="image/x-icon" href="/favicon.ico">
		
	<!--astro:head--></head>
	<body>
		<main class="astro-EVQ4BTHH">
			${$$renderComponent($$result,'Counter',Counter,{"client:only":true,"client:component-hydration":"only","class":"astro-EVQ4BTHH","client:component-path":($$metadata.resolvePath("../components/Counter.svelte")),"client:component-export":"default"},{"default": () => $$render`<h1 class="astro-EVQ4BTHH">Hello, Svelte!</h1>`,})}
		</main>
	</body></html>`;
});
export default $$Index;

//# sourceMappingURL=data:application/json;charset=utf-8;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiL1VzZXJzL2JlbmhvbG1lcy9SZXBvc2l0b3JpZXMvYXN0cm8vZXhhbXBsZXMvZnJhbWV3b3JrLXN2ZWx0ZS9zcmMvcGFnZXMvaW5kZXguYXN0cm8iXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi0tLVxuLy8gQ29tcG9uZW50IEltcG9ydHNcbmltcG9ydCBDb3VudGVyIGZyb20gJy4uL2NvbXBvbmVudHMvQ291bnRlci5zdmVsdGUnO1xuXG4vLyBGdWxsIEFzdHJvIENvbXBvbmVudCBTeW50YXg6XG4vLyBodHRwczovL2RvY3MuYXN0cm8uYnVpbGQvY29yZS1jb25jZXB0cy9hc3Ryby1jb21wb25lbnRzL1xuLS0tXG5cblx1MDAzY2h0bWwgbGFuZz1cImVuXCJcdTAwM2Vcblx0XHUwMDNjaGVhZFx1MDAzZVxuXHRcdFx1MDAzY21ldGEgY2hhcnNldD1cInV0Zi04XCIgL1x1MDAzZVxuXHRcdFx1MDAzY21ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aFwiIC9cdTAwM2Vcblx0XHRcdTAwM2NsaW5rIHJlbD1cImljb25cIiB0eXBlPVwiaW1hZ2UveC1pY29uXCIgaHJlZj1cIi9mYXZpY29uLmljb1wiIC9cdTAwM2Vcblx0XHRcdTAwM2NzdHlsZVx1MDAzZVxuXHRcdFx0aHRtbCxcblx0XHRcdGJvZHkge1xuXHRcdFx0XHRmb250LWZhbWlseTogc3lzdGVtLXVpO1xuXHRcdFx0XHRtYXJnaW46IDA7XG5cdFx0XHR9XG5cdFx0XHRib2R5IHtcblx0XHRcdFx0cGFkZGluZzogMnJlbTtcblx0XHRcdH1cblx0XHRcdTAwM2Mvc3R5bGVcdTAwM2Vcblx0XHUwMDNjL2hlYWRcdTAwM2Vcblx0XHUwMDNjYm9keVx1MDAzZVxuXHRcdFx1MDAzY21haW5cdTAwM2Vcblx0XHRcdFx1MDAzY0NvdW50ZXIgY2xpZW50Om9ubHlcdTAwM2Vcblx0XHRcdFx0XHUwMDNjaDFcdTAwM2VIZWxsbywgU3ZlbHRlIVx1MDAzYy9oMVx1MDAzZVxuXHRcdFx0XHUwMDNjL0NvdW50ZXJcdTAwM2Vcblx0XHRcdTAwM2MvbWFpblx1MDAzZVxuXHRcdTAwM2MvYm9keVx1MDAzZVxuXHUwMDNjL2h0bWxcdTAwM2VcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLEFBQUc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTUE7QUFBQTtBQUFBO0FBTkE7QUFBQSxnQkFRQyxDQUFDLElBQUQsQ0FBSyxLQUFNLElBQVgsQ0FSRCxzQkFRQyxDQUFlO0FBQUEsQ0FDZCxDQUFDLElBQUQsQ0FBSztBQUFBLEVBQ0osQ0FBQyxJQUFELENBQUssUUFBUyxPQUFkLENBQXVCO0FBQUEsRUFDdkIsQ0FBQyxJQUFELENBQUssS0FBTSxVQUFYLENBQXFCLFFBQVMsb0JBQTlCLENBQW9EO0FBQUEsRUFDcEQsQ0FBQyxJQUFELENBQUssSUFBSyxNQUFWLENBQWdCLEtBQU0sY0FBdEIsQ0FBb0MsS0FBTSxjQUExQyxDQUEwRDtBQUFBLEVBVW5EO0FBQUEsQ0FDUCxBQXZCSCx3QkF1QlE7QUFBQSxDQUNOLENBQUMsSUFBRCxDQUFLO0FBQUEsRUFDSixDQUFDLElBQUQsQ0F6Qkgsc0JBeUJHLENBQUs7QUFBQSxHQUNKLHVDQUFDLElBQUQsRUFBUSxtQkExQlosOE1BMkJLLENBQUMsRUFBRCxDQTNCTCxzQkEyQkssQ0FBRyxjQUFnQixLQTNCeEIsR0E0QkssRUFBUTtBQUFBLEVBQ1QsT0FBSztBQUFBLENBQ04sT0E5Qkg7QUFBQTtBQUFBOyIsCiAgIm5hbWVzIjogW10KfQ==
