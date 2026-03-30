import { StandardLanguageProcessor } from './standard-language-processor';

/**
 * SCSS 文件处理器
 * 支持 SASS/SCSS 样式文件的依赖分析
 */
export class ScssFileProcessor extends StandardLanguageProcessor {
  constructor() {
    super('scss');
  }
}
