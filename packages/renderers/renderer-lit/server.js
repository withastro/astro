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

  if (attrs) {
    for (let [name, value] of Object.entries(attrs)) {
      // Stringify every JSX bound object. This means that one cannot pass a
      // non-stringifiable object as a bound JSX prop, e.g. an HTMLElement ref.
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      if (typeof value === 'boolean') {
        // Booleans are calculated with hasAttibute, so don't setAttribute if
        // false. If user wants `attr="false"` then they must use a string.
        if (!value) {
          continue;
        }

        value = '';
      }

      // Set the attribute no matter if it's a reactive property or not this
      // helps make sure that all SSRd values are serialized to the DOM. If a
      // property cannot react to attribute changes, then it's not suitable for
      // SSG that Astro provides.
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
