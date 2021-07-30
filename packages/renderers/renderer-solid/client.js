import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';

export default (element) => (Component, props, childHTML) => {
  // Solid's `render` does not replace the element's children.
  // Deleting the root's children is necessary before calling `render`.
  element.replaceChildren();

  const children = document.createElement('astro-fragment');
  children.innerHTML = childHTML;

  // Using Solid's `render` method ensures that a `root` is created
  // in order to properly handle reactivity. It also handles
  // components that are not native HTML elements.
  render(() => createComponent(Component, { ...props, children }), element);
};
