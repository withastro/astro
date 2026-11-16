import { MriCliArgumentParser } from '../../../dist/cli/infra/mri-cli-argument-parser.js';
import { cliArgumentParserContract } from './argument-parser.contract.ts';

const parser = new MriCliArgumentParser();
cliArgumentParserContract(parser);
