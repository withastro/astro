/**
 * Given a Record<string, string> of raw HTML attributes, fix various cases to be React
 * component compatible
 * 
 * See https://legacy.reactjs.org/docs/dom-elements.html
 * 
 * @param attrs 
 */
export function mutateRawHtmlAttributesToReactifiedVariants(attrs: Record<string, unknown>): void {
  mutateRenameAttr(attrs, "colspan", "colSpan");
  mutateRenameAttr(attrs, "rowspan", "rowSpan");
}

function mutateRenameAttr(attrs: Record<string, unknown>, originalName: string, newName: string): void {
  if (attrs[originalName]) {
    attrs[originalName] = attrs[newName];
    delete attrs[originalName];
  }
}
