import Component from '../Component';
import Node from './shared/Node';
import Element from './Element';
import Text from './Text';
import Expression from './shared/Expression';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class Attribute extends Node {
  type: 'Attribute' | 'Spread';
  start: number;
  end: number;
  scope: TemplateScope;
  component: Component;
  parent: Element;
  name: string;
  is_spread: boolean;
  is_true: boolean;
  is_static: boolean;
  expression?: Expression;
  chunks: Array<Text | Expression>;
  dependencies: Set<string>;
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
  get_dependencies(): string[];
  get_value(
    block: any
  ):
    | import('estree').Identifier
    | import('estree').SimpleLiteral
    | import('estree').RegExpLiteral
    | import('estree').Program
    | import('estree').FunctionDeclaration
    | import('estree').FunctionExpression
    | import('estree').ArrowFunctionExpression
    | import('estree').SwitchCase
    | import('estree').CatchClause
    | import('estree').VariableDeclarator
    | import('estree').ExpressionStatement
    | import('estree').BlockStatement
    | import('estree').EmptyStatement
    | import('estree').DebuggerStatement
    | import('estree').WithStatement
    | import('estree').ReturnStatement
    | import('estree').LabeledStatement
    | import('estree').BreakStatement
    | import('estree').ContinueStatement
    | import('estree').IfStatement
    | import('estree').SwitchStatement
    | import('estree').ThrowStatement
    | import('estree').TryStatement
    | import('estree').WhileStatement
    | import('estree').DoWhileStatement
    | import('estree').ForStatement
    | import('estree').ForInStatement
    | import('estree').ForOfStatement
    | import('estree').VariableDeclaration
    | import('estree').ClassDeclaration
    | import('estree').ThisExpression
    | import('estree').ArrayExpression
    | import('estree').ObjectExpression
    | import('estree').YieldExpression
    | import('estree').UnaryExpression
    | import('estree').UpdateExpression
    | import('estree').BinaryExpression
    | import('estree').AssignmentExpression
    | import('estree').LogicalExpression
    | import('estree').MemberExpression
    | import('estree').ConditionalExpression
    | import('estree').SimpleCallExpression
    | import('estree').NewExpression
    | import('estree').SequenceExpression
    | import('estree').TemplateLiteral
    | import('estree').TaggedTemplateExpression
    | import('estree').ClassExpression
    | import('estree').MetaProperty
    | import('estree').AwaitExpression
    | import('estree').ImportExpression
    | import('estree').ChainExpression
    | import('estree').Property
    | import('estree').Super
    | import('estree').TemplateElement
    | import('estree').SpreadElement
    | import('estree').ObjectPattern
    | import('estree').ArrayPattern
    | import('estree').RestElement
    | import('estree').AssignmentPattern
    | import('estree').ClassBody
    | import('estree').MethodDefinition
    | import('estree').ImportDeclaration
    | import('estree').ExportNamedDeclaration
    | import('estree').ExportDefaultDeclaration
    | import('estree').ExportAllDeclaration
    | import('estree').ImportSpecifier
    | import('estree').ImportDefaultSpecifier
    | import('estree').ImportNamespaceSpecifier
    | import('estree').ExportSpecifier
    | {
        type: string;
        value: string;
      };
  get_static_value(): string | true;
  should_cache(): boolean;
}
