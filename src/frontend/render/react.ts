import React from 'react';
import ReactDOMServer from 'react-dom/server';

export function __react_static(ReactComponent: any) {
  return (attrs: Record<string, any>, ...children: any): string => {
    let html = ReactDOMServer.renderToString(
      React.createElement(
        ReactComponent,
        attrs,
        children
      )
    );
    return html;
  };
}

export function __react_dynamic(ReactComponent: any, importUrl: string, reactUrl: string, reactDomUrl: string) {
  const placeholderId = `placeholder_${String(Math.random())}`;
  return (attrs: Record<string, string>, ...children: any) => {
    return `<div id="${placeholderId}"></div><script type="module">
            import React from '${reactUrl}';
            import ReactDOM from '${reactDomUrl}';
            import Component from '${importUrl}';

            ReactDOM.render(React.createElement(Component, ${JSON.stringify(attrs)}), document.getElementById('${placeholderId}'));
        </script>`;
  };
}
