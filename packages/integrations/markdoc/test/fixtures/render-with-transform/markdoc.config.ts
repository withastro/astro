import { Markdoc, component, defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    fence: {
      // Spread the built-in fence config (which has a transform function)
      // while overriding with a custom render component.
      // This is the scenario from issue #9708 - render should win over transform.
      ...Markdoc.nodes.fence,
      render: component('./src/components/CustomFence.astro'),
      attributes: {
        ...Markdoc.nodes.fence.attributes,
        // Override content to make it renderable as a prop
        content: { type: String, render: true, required: true },
        // Override language to render as 'language' prop instead of 'data-language'
        language: { type: String, render: true },
      },
    },
  },
});
