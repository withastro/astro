export interface MicromarkExtensionContext {
  sliceSerialize(node: any): string;
  raw(value: string): void;
  tag(value: string): void;
  data(value: string): void;
  resume(): any;
}

export type MicromarkExtensionCallback = (this: MicromarkExtensionContext, node: any) => void;

export interface MicromarkExtension {
  enter?: Record<string, MicromarkExtensionCallback>;
  exit?: Record<string, MicromarkExtensionCallback>;
}
