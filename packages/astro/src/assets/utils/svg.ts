type SvgAttributes = Record<string, any>;

// Some attributes required for `image/svg+xml` are irrelevant when
// inlined in a `text/html` doc. Save a few bytes by dropping them!
const ATTRS_TO_DROP = ['xmlns', 'xmlns:xlink', 'version'];
const DEFAULT_ATTRS: SvgAttributes = { role: 'img' }

export function dropAttributes(attributes: SvgAttributes) {
    for (const attr of ATTRS_TO_DROP) {
        delete attributes[attr];
    }
    return attributes;
}

export function normalizeProps(attributes: SvgAttributes, { size, ...props }: SvgAttributes) {
    if (size) {
        props.width = size;
        props.height = size;
    }
    return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

export function makeNonEnumerable(object: Record<string, any>) {
    for (const property in object) {
        Object.defineProperty(object, property, { enumerable: false });
    }
}
