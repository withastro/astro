import * as vscode from 'vscode';

export async function activate() {
  onConfigUpdated();

  vscode.workspace.onDidChangeConfiguration(onConfigUpdated);

  function onConfigUpdated() {
    const astro = vscode.extensions.getExtension('skypack.astro');
    if (!astro) {
      return;
    }
    const emmet = vscode.extensions.getExtension('vscode.emmet');
    if (!emmet) {
      return;
    }

    const emmetIncludeLanguages = getEmmetIncludeLanguages();
    if (emmetIncludeLanguages && emmetIncludeLanguages['astro']) {
      return;
    }
    setEmmetIncludeLanguages({ ...emmetIncludeLanguages, astro: 'html' });
  }
  function getEmmetIncludeLanguages() {
    return vscode.workspace.getConfiguration('emmet').get<Record<string, string>>('includeLanguages');
  }
  function setEmmetIncludeLanguages(value: Record<string, string>) {
    return vscode.workspace.getConfiguration('emmet').set('includeLanguages', value);
  }
}
