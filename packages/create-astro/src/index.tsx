import 'source-map-support/register.js';
import React from 'react';
import App from './components/App';
import Version from './components/Version';
import Exit from './components/Exit';
import { render } from 'ink';
import { getTemplates, addProcessListeners } from './utils';
import { args as argsConfig } from './config';
import arg from 'arg';
import Help from './components/Help';

/** main `create-astro` CLI */
export default async function createAstro() {
  const args = arg(argsConfig);
  const projectName = args._[0];
  if (args['--version']) {
    return render(<Version />);
  }
  const templates = await getTemplates();
  if (args['--help']) {
    return render(<Help context={{ templates }} />);
  }

  const pkgManager = /yarn/.test(process.env.npm_execpath) ? 'yarn' : 'npm';
  const use = (args['--use'] ?? pkgManager) as 'npm' | 'yarn';
  const template = args['--template'];
  const force = args['--force'];
  const skipInstall = args['--skip-install'];

  const app = render(<App context={{ projectName, template, templates, force, skipInstall, use }} />);

  const onError = () => {
    if (app) app.clear();
    render(<Exit didError />);
  };
  const onExit = () => {
    if (app) app.clear();
    render(<Exit />);
  };
  addProcessListeners([
    ['uncaughtException', onError],
    ['exit', onExit],
    ['SIGINT', onExit],
    ['SIGTERM', onExit],
  ]);
}
