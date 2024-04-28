import type {SerializedSSRManifest} from "../app/types.js";
import type {StylesheetAsset} from "./types.js";

export function mergeSpaStylesheets(manifest: SerializedSSRManifest) {
  const routes = manifest.routes.map(r => r);
  const styles = routes.flatMap(r => r.styles);
  const inlineStyleContents = styles
    .map(s => s.type === "inline" ? s.content : null)
    .filter(s => typeof s === "string") as string[];
  const externalStyleSources = styles
    .map(s => s.type === "external" ? s.src : null)
    .filter(s => typeof s === "string") as string[];
  const inlineStyle: StylesheetAsset = {
    type: "inline",
    content: mergeInlineStylesheets(inlineStyleContents)
  };
  const externalStyles = mergeExternalStyleSheets(externalStyleSources)
    .map(src => ({
      type: "external",
      src
    } satisfies StylesheetAsset));
  for (const route of routes) {
    route.styles = [inlineStyle, ...externalStyles];
  }
}

function mergeExternalStyleSheets(
  sources: string[]
): string[] {
  const set = new Set<string>();
  for (const source of sources) {
    set.add(source);
  }
  return Array.from(set);
}

function mergeInlineStylesheets(values: string[]) : string {
  const merged = values.join("");
  const ruleSet = new Set();
  const rules = merged.split(";").map(s => s.trim());
  for (const rule of rules) {
    ruleSet.add(rule);
  }
  return Array.from(ruleSet).join(";");
}
