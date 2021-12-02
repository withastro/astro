import { hydrate, createComponent } from 'solid-js/web';

export default (element) => (Component, props, childHTML) => {
  let children;
  if (childHTML != null) {
    children = document.createElement('astro-fragment');
    children.innerHTML = childHTML;
  }

  // Using Solid's `hydrate` method ensures that a `root` is created
  // in order to properly handle reactivity. It also handles
  // components that are not native HTML elements.
  hydrate(() => createComponent(Component, { ...props, children }), element);
};
