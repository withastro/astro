// @ts-expect-error untyped export
import { createComponent, renderComponent, renderSlot } from 'astro/server/index.js';
import type { HTMLTag, HTMLAttributes } from 'astro/types';

/** A component that will only render if all child expressions are truthy */
const Maybe = createComponent(async function (result: any, props: any, slots: any) {
    const content = await renderSlot(result, slots['default'])
    const { as, ...attrs } = props;
    const name = typeof as === 'string' ? as : as?.name;
    if (content?.trim()) {
        if ('expressions' in slots.default && (slots.default.expressions.length > 0 && slots.default.expressions.every((item: any) => !item))) return;
        return renderComponent(result, name, as, attrs, { default: () => content });
    }
}) as unknown as <Tag extends HTMLTag>(props: { as: Tag } & HTMLAttributes<Tag>) => any;

export { Maybe };
