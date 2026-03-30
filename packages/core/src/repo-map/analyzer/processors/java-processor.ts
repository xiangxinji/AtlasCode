import { StandardLanguageProcessor } from './standard-language-processor';

/**
 * Java 文件处理器
 */
export class JavaFileProcessor extends StandardLanguageProcessor {
  constructor() {
    super('java');
  }
}
