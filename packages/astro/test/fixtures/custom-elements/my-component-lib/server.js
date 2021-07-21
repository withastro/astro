import './shim.js';

function getConstructor(Component) {
  if(typeof Component === 'string') {
    const tagName = Component;
    Component = customElements.get(tagName);
  }
  return Component;
}

function check(component) {
  const Component = getConstructor(component);
  if(typeof Component === 'function' && globalThis.HTMLElement.isPrototypeOf(Component)) {
    return true;
  }
  return false;
}

function renderToStaticMarkup(component) {
  const Component = getConstructor(component);
  const el = new Component();
  el.connectedCallback();
  const html = `<${el.localName}><template shadowroot="open">${el.shadowRoot.innerHTML}</template>${el.innerHTML}</${el.localName}>`
  return {
    html
  };
}

export default {
  check,
  renderToStaticMarkup
};