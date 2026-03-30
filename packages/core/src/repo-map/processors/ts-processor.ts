import { StandardLanguageProcessor } from './standard-language-processor';

/**
 * TypeScript 文件处理器
 */
export class TypeScriptFileProcessor extends StandardLanguageProcessor {
  constructor() {
    super('ts');
  }
}
