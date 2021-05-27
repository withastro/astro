/** Convert TemplateNode attributes to string */
function serializeAttrs(attrs) {
  let result = '';
  for (const key of Object.keys(attrs)) {
    result += `${key}="${attrs[key]}" `;
  }
  return result.trim();
}

function check(Component, props) {
  return typeof Component === 'string' && Component.indexOf('-') > -1;
}

function renderToStaticMarkup(hydratePackage) {
  return async (tag, props, children) => {
    const lib = await import(hydratePackage);
    const element = `<${tag} ${serializeAttrs(props)}>${children}</${tag}>`;
    const { html } = await lib.renderToString(`<astro-fragment>${element}</astro-fragment>`);
    let head = html.split(/<\/?head>/g)[1];
    head = head.replace(/<meta charset="utf-8">/g, '');
    const innerHTML = html.split(/<\/?astro-fragment>/g)[1].trim();
    return { html: innerHTML, head };
  }
}

export default ({ hydrate: hydratePackage }) => {
  return {
    check,
    renderToStaticMarkup: renderToStaticMarkup(hydratePackage),
  }
};
