import { CompletionContext, CompletionItem, CompletionList, DefinitionLink, Location, Position, TextDocumentIdentifier } from 'vscode-languageserver';
import type { DocumentManager } from '../core/documents';
import type * as d from './interfaces';
import { flatten } from '../utils';
import { FoldingRange } from 'vscode-languageserver-types';

enum ExecuteMode {
  None,
  FirstNonNull,
  Collect,
}

interface PluginHostConfig {
  filterIncompleteCompletions: boolean;
  definitionLinkSupport: boolean;
}

export class PluginHost {
  private plugins: d.Plugin[] = [];
  private pluginHostConfig: PluginHostConfig = {
    filterIncompleteCompletions: true,
    definitionLinkSupport: false,
  };

  constructor(private documentsManager: DocumentManager) {}

  initialize(pluginHostConfig: PluginHostConfig) {
    this.pluginHostConfig = pluginHostConfig;
  }

  register(plugin: d.Plugin) {
    this.plugins.push(plugin);
  }

  async getCompletions(textDocument: TextDocumentIdentifier, position: Position, completionContext?: CompletionContext): Promise<CompletionList> {
    const document = this.getDocument(textDocument.uri);
    if (!document) {
      throw new Error('Cannot call methods on an unopened document');
    }

    const completions = (await this.execute<CompletionList>('getCompletions', [document, position, completionContext], ExecuteMode.Collect)).filter(
      (completion) => completion != null
    );

    let flattenedCompletions = flatten(completions.map((completion) => completion.items));
    const isIncomplete = completions.reduce((incomplete, completion) => incomplete || completion.isIncomplete, false as boolean);

    return CompletionList.create(flattenedCompletions, isIncomplete);
  }

  async resolveCompletion(textDocument: TextDocumentIdentifier, completionItem: d.AppCompletionItem): Promise<CompletionItem> {
    const document = this.getDocument(textDocument.uri);

    if (!document) {
      throw new Error('Cannot call methods on an unopened document');
    }

    const result = await this.execute<CompletionItem>('resolveCompletion', [document, completionItem], ExecuteMode.FirstNonNull);

    return result ?? completionItem;
  }

  async doTagComplete(textDocument: TextDocumentIdentifier, position: Position): Promise<string | null> {
    const document = this.getDocument(textDocument.uri);
    if (!document) {
      throw new Error('Cannot call methods on an unopened document');
    }

    return this.execute<string | null>('doTagComplete', [document, position], ExecuteMode.FirstNonNull);
  }

  async getFoldingRanges(textDocument: TextDocumentIdentifier): Promise<FoldingRange[] | null> {
    const document = this.getDocument(textDocument.uri);
    if (!document) {
      throw new Error('Cannot call methods on an unopened document');
    }

    const foldingRanges = flatten(await this.execute<FoldingRange[]>('getFoldingRanges', [document], ExecuteMode.Collect)).filter((completion) => completion != null);

    return foldingRanges;
  }

  async getDefinitions(textDocument: TextDocumentIdentifier, position: Position): Promise<DefinitionLink[] | Location[]> {
    const document = this.getDocument(textDocument.uri);
    if (!document) {
      throw new Error('Cannot call methods on an unopened document');
    }

    const definitions = flatten(await this.execute<DefinitionLink[]>('getDefinitions', [document, position], ExecuteMode.Collect));

    if (this.pluginHostConfig.definitionLinkSupport) {
      return definitions;
    } else {
      return definitions.map((def) => <Location>{ range: def.targetSelectionRange, uri: def.targetUri });
    }
  }

  onWatchFileChanges(onWatchFileChangesParams: any[]): void {
    for (const support of this.plugins) {
      support.onWatchFileChanges?.(onWatchFileChangesParams);
    }
  }

  private getDocument(uri: string) {
    return this.documentsManager.get(uri);
  }

  private execute<T>(name: keyof d.LSProvider, args: any[], mode: ExecuteMode.FirstNonNull): Promise<T | null>;
  private execute<T>(name: keyof d.LSProvider, args: any[], mode: ExecuteMode.Collect): Promise<T[]>;
  private execute(name: keyof d.LSProvider, args: any[], mode: ExecuteMode.None): Promise<void>;
  private async execute<T>(name: keyof d.LSProvider, args: any[], mode: ExecuteMode): Promise<(T | null) | T[] | void> {
    const plugins = this.plugins.filter((plugin) => typeof plugin[name] === 'function');

    switch (mode) {
      case ExecuteMode.FirstNonNull:
        for (const plugin of plugins) {
          const res = await this.tryExecutePlugin(plugin, name, args, null);
          if (res != null) {
            return res;
          }
        }
        return null;
      case ExecuteMode.Collect:
        return Promise.all(plugins.map((plugin) => this.tryExecutePlugin(plugin, name, args, [])));
      case ExecuteMode.None:
        await Promise.all(plugins.map((plugin) => this.tryExecutePlugin(plugin, name, args, null)));
        return;
    }
  }

  private async tryExecutePlugin(plugin: any, fnName: string, args: any[], failValue: any) {
    try {
      return await plugin[fnName](...args);
    } catch (e) {
      console.error(e);
      return failValue;
    }
  }
}
