import { StandardLanguageProcessor } from './standard-language-processor';

/**
 * LESS 文件处理器
 * 支持 LESS 样式文件的依赖分析
 */
export class LessFileProcessor extends StandardLanguageProcessor {
  constructor() {
    super('less');
  }
}
