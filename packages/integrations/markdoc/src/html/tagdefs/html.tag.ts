// third party
import type { Config, Schema } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";

// local
import { parseInlineCSSToReactLikeObject } from "../css/parse-inline-css-to-react.js";
import { mutateRawHtmlAttributesToReactifiedVariants } from "../htmlattributes/mutate-raw-html-attributes-to-react-compatible-variants.js";

// a Markdoc tag that will render a given HTML element and its attributes, as produced by the htmlTokenTransform function
export const htmlTag: Schema<Config, never> = {

  attributes: {
    name: { type: String, required: true },
    attrs: { type: Object },
  },

  transform(node, config) {

    const { name, attrs: unsafeAttributes } = node.attributes;
    const children = node.transformChildren(config);

    // pull out any "unsafe" attributes which need additional processing
    const { style, ...safeAttributes } = unsafeAttributes as Record<string, unknown>;

    // if the inline "style" attribute is present we need to parse the HTML into a react-like React.CSSProperties object
    if (typeof style === "string") {
      const styleObject = parseInlineCSSToReactLikeObject(style);
      safeAttributes.style = styleObject;
    }

    // fix (rename/mutate) various raw HTML attributes that need to be camelCase'd for React
    mutateRawHtmlAttributesToReactifiedVariants(safeAttributes);

    // create a Markdoc Tag for the given HTML node with the HTML attributes and children
    return new Markdoc.Tag(name, safeAttributes, children);
  },
};
