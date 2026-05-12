# Satteri notes

Observations about `satteri@0.4.0` (the upstream Rust crate / npm package).

## Bugs / surprises

### HTML serializer encodes `"` in attribute values as `&quot;` instead of `&#x22;`

When a hast plugin sets an attribute value containing a `"`, the serializer escapes it as the named entity `&quot;`. The rest of the unified-stack (rehype-stringify, etc.) emits the hex entity `&#x22;`. Downstream tooling that does `attr.replace(/&#x22;/g, '"')` before parsing won't round-trip.

Repro:

```js
import * as s from 'satteri';
const html = await s.markdownToHtml('test', {
  hastPlugins: [s.defineHastPlugin({
    name: 'mark',
    element: { filter: ['p'], visit(node, ctx) {
      ctx.setProperty(node, 'data-test', '{"a":"b"}');
    } },
  })],
});
// → <p data-test="{&quot;a&quot;:&quot;b&quot;}">test</p>
```

Ideally the serializer would emit `&#x22;` (matches convention) or expose an option.
