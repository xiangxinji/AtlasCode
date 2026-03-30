import { BaseFileProcessor } from './base-processor';
import { AnalysisResult } from '@/types/repo-map';

/**
 * HTML 文件处理器
 * 支持 HTML 文件的依赖分析，提取 <script src=""> 和 <link href=""> 中的依赖
 */
export class HtmlFileProcessor extends BaseFileProcessor {
  constructor() {
    super('html');
  }

  analyze(filePath: string, content: string): AnalysisResult {
    const dependencies = new Set<string>();

    // 提取 <script src=""> 中的依赖
    const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      const dep = this.cleanDependencyPath(match[1]);
      if (this.isValidDependency(dep)) {
        dependencies.add(dep);
      }
    }

    // 提取 <link href=""> 中的依赖
    const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
    while ((match = linkRegex.exec(content)) !== null) {
      const dep = this.cleanDependencyPath(match[1]);
      if (this.isValidDependency(dep)) {
        dependencies.add(dep);
      }
    }

    // 提取 <img src=""> 中的依赖
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = imgRegex.exec(content)) !== null) {
      const dep = this.cleanDependencyPath(match[1]);
      if (this.isValidDependency(dep)) {
        dependencies.add(dep);
      }
    }

    // 提取 <a href=""> 中的依赖
    const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    while ((match = aRegex.exec(content)) !== null) {
      const dep = this.cleanDependencyPath(match[1]);
      if (this.isValidDependency(dep)) {
        dependencies.add(dep);
      }
    }

    return {
      dependencies: Array.from(dependencies),
      metadata: {
        language: this.fileExtension
      }
    };
  }
}
