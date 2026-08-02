import { Markdoc, component, defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  tags: {
    sidenote: {
      render: component('./src/components/Aside.astro'),
      attributes: {
        title: { type: String, required: true },
      },
      transform(node, config) {
        // Uses `this.render` to reference the component — the pattern from issue #17458.
        // Also adds a custom "transformed" attribute to prove the transform ran.
        return new Markdoc.Tag(this.render, {
          title: node.attributes.title ?? '',
          transformed: 'true',
        });
      },
    },
  },
});
