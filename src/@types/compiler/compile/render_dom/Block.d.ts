import Renderer from './Renderer';
import Wrapper from './wrappers/shared/Wrapper';
import { Node, Identifier } from 'estree';
export interface Bindings {
  object: Identifier;
  property: Identifier;
  snippet: Node;
  store: string;
  modifier: (node: Node) => Node;
}
export interface BlockOptions {
  parent?: Block;
  name: Identifier;
  type: string;
  renderer?: Renderer;
  comment?: string;
  key?: Identifier;
  bindings?: Map<string, Bindings>;
  dependencies?: Set<string>;
}
export default class Block {
  parent?: Block;
  renderer: Renderer;
  name: Identifier;
  type: string;
  comment?: string;
  wrappers: Wrapper[];
  key: Identifier;
  first: Identifier;
  dependencies: Set<string>;
  bindings: Map<string, Bindings>;
  binding_group_initialised: Set<string>;
  chunks: {
    declarations: Array<Node | Node[]>;
    init: Array<Node | Node[]>;
    create: Array<Node | Node[]>;
    claim: Array<Node | Node[]>;
    hydrate: Array<Node | Node[]>;
    mount: Array<Node | Node[]>;
    measure: Array<Node | Node[]>;
    fix: Array<Node | Node[]>;
    animate: Array<Node | Node[]>;
    intro: Array<Node | Node[]>;
    update: Array<Node | Node[]>;
    outro: Array<Node | Node[]>;
    destroy: Array<Node | Node[]>;
  };
  event_listeners: Node[];
  maintain_context: boolean;
  has_animation: boolean;
  has_intros: boolean;
  has_outros: boolean;
  has_intro_method: boolean;
  has_outro_method: boolean;
  outros: number;
  aliases: Map<string, Identifier>;
  variables: Map<
    string,
    {
      id: Identifier;
      init?: Node;
    }
  >;
  get_unique_name: (name: string) => Identifier;
  has_update_method: boolean;
  autofocus: string;
  constructor(options: BlockOptions);
  assign_variable_names(): void;
  add_dependencies(dependencies: Set<string>): void;
  add_element(id: Identifier, render_statement: Node, claim_statement: Node, parent_node: Node, no_detach?: boolean): void;
  add_intro(local?: boolean): void;
  add_outro(local?: boolean): void;
  add_animation(): void;
  add_variable(id: Identifier, init?: Node): void;
  alias(name: string): Identifier;
  child(options: BlockOptions): Block;
  get_contents(key?: any): Node[];
  has_content(): boolean;
  render(): Node[];
  render_listeners(chunk?: string): void;
}
