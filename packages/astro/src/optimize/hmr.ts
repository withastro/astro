import type { EsmHmrEngine } from 'snowpack/lib/hmr-server-engine';
import { visit } from 'unist-util-visit';

const hmr = ({ port }: { port: number }) => (node: any) => {
  const { tagName } = node;
  if (tagName === 'head') {
    node.children = [
      ...(node.children ?? []),
      {
        type: 'element',
        tagName: 'script',
        properties: {},
        children: [{
          type: 'text',
          value: `window.HMR_WEBSOCKET_URL = 'ws://localhost:${port}';`
        }]
      },
      {
        type: 'element',
        tagName: 'script',
        properties: { type: 'module', src: '/_snowpack/hmr-client.js' },
        children: []
      }
    ];
  }
  return node;
};

export default ({ hmrEngine }: { hmrEngine?: EsmHmrEngine }) => (tree: any) => {
  if (!hmrEngine) return;
  visit(tree, 'element', hmr({ port: hmrEngine.port }));
}

// <script
//   data-csr="true"
//   dangerouslySetInnerHTML={{
//     __html: `window.HMR_WEBSOCKET_URL = 'ws://localhost:3333';`,
//   }}
// />
// <script type="module" src="/_snowpack/hmr-client.js" />
