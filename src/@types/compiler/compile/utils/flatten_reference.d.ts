import { Node } from 'estree';
export default function flatten_reference(
  node: Node
): {
  name: string;
  nodes: any[];
  parts: any[];
};
