import "atomico/ssr/load";
import { h } from "atomico";

/**
 * @type {import("astro").SSRLoadedRenderer["ssr"]}
 */
const SSR = {
  check(Component) {
    const Element =
      Component.prototype instanceof HTMLElement
        ? Component
        : customElements.get(Component);
    return !!Element?.props;
  },
  renderToStaticMarkup(Component, props, slots) {
    let fragment = "";

    for (const slot in slots) {
      fragment += slots[slot];
    }

    return { html: h(Component, props).render(fragment) };
  },
};

export default SSR;
