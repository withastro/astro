import './server-shim.js';
import '@lit-labs/ssr/lib/render-lit-html.js';
import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';

function isCustomElementTag(name) {
  return typeof name === 'string' && /-/.test(name);
}

function getCustomElementConstructor(name) {
  if (typeof customElements !== 'undefined' && isCustomElementTag(name)) {
    return customElements.get(name) || null;
  }
  return null;
}

async function isLitElement(Component) {
  const Ctr = getCustomElementConstructor(Component);
  return !!(Ctr && Ctr._$litElement$);
}

async function check(Component, _props, _children) {
  // Lit doesn't support getting a tagName from a Constructor at this time.
  // So this must be a string at the moment.
  return !!(await isLitElement(Component));
}

function* render(tagName, attrs, children) {
  const instance = new LitElementRenderer(tagName);

  // LitElementRenderer creates a new element instance, so copy over.
  const Ctr = getCustomElementConstructor(tagName);

  if (attrs) {
    for (let [name, value] of Object.entries(attrs)) {
      // Stringify every JSX bound object. This means that one cannot pass a
      // non-stringifiable object as a bound JSX prop, e.g. an HTMLElement ref.
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      // Check if this is on the element prototype. In many cases it is probably
      // a reactive property. If it's not, then we make the tradeoff that that
      // property is not SSR-able without an additional script.
      if (name in Ctr.prototype) {
        if (typeof value === 'boolean') {
          // Booleans are calculated with hasAttibute, so don't setAttribute if
          // false
          if (!value) {
            continue;
          }

          value = '';
        }
      }

      // Set the attribute no matter if it's a reactive property or not
      instance.setAttribute(name, value);
    }
  }

  instance.connectedCallback();

  yield `<${tagName}`;
  yield* instance.renderAttributes();
  yield `>`;
  const shadowContents = instance.renderShadow({});
  if (shadowContents !== undefined) {
    yield '<template shadowroot="open">';
    yield* shadowContents;
    yield '</template>';
  }
  yield children || ''; // don’t print “undefined” as string
  yield `</${tagName}>`;
}

async function renderToStaticMarkup(Component, props, children) {
  let tagName = Component;

  let out = '';
  for (let chunk of render(tagName, props, children)) {
    out += chunk;
  }

  return {
    html: out,
  };
}

export default {
  check,
  renderToStaticMarkup,
};
