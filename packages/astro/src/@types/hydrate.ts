export type GetHydrateCallback = () => Promise<(element: Element, innerHTML: string | null) => void>;

export interface HydrateOptions {
  value?: string;
}
