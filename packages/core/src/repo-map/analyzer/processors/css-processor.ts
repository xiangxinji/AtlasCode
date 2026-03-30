import { StandardLanguageProcessor } from './standard-language-processor';

/**
 * CSS 文件处理器
 * 支持 CSS、SCSS、LESS 等样式文件的依赖分析
 */
export class CssFileProcessor extends StandardLanguageProcessor {
  constructor() {
    super('css');
  }
}
