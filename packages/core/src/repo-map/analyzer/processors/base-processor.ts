import * as path from 'path';
import { ParserConfig, AnalysisResult } from '@/types/repo-map';

/**
 * 文件处理器抽象基类
 * 定义了所有文件处理器必须实现的接口 
 */
export abstract class BaseFileProcessor {
  protected parserConfig?: ParserConfig;

  constructor(protected fileExtension: string) {}

  /**
   * 分析文件并返回依赖关系
   */
  abstract analyze(filePath: string, content: string): AnalysisResult;

  /**
   * 设置解析器配置
   */
  setParserConfig(config: ParserConfig): void {
    this.parserConfig = config;
  }

  /**
   * 获取文件扩展名
   */
  getExtension(): string {
    return this.fileExtension;
  }

  /**
   * 验证是否支持该文件
   */
  supports(filePath: string): boolean {
    return path.extname(filePath).slice(1) === this.fileExtension;
  }

  /**
   * 提取字符串中的依赖路径
   */
  protected cleanDependencyPath(text: string): string {
    return text.replace(/^["']|["']$/g, '');
  }

  /**
   * 验证依赖路径是否有效
   */
  protected isValidDependency(dep: string): boolean {
    return Boolean(dep && dep.length > 0 && dep.length < 500);
  }
}
