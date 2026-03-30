import { BaseFileProcessor } from './base-processor';
import { AnalysisResult } from '@/types/repo-map';

/**
 * 标准语言文件处理器基类
 * 处理 JavaScript、TypeScript、Java 等标准语言
 */
export abstract class StandardLanguageProcessor extends BaseFileProcessor {
  analyze(filePath: string, content: string): AnalysisResult {
    if (!this.parserConfig) {
      throw new Error(`Parser config not set for ${this.fileExtension} processor`);
    }

    const dependencies = new Set<string>();

    try {
      const tree = this.parserConfig.parser.parse(content);
      if (tree) {
        this.extractAllDependencies(tree.rootNode, dependencies);
      }
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
    }

    return {
      dependencies: Array.from(dependencies),
      metadata: {
        language: this.fileExtension
      }
    };
  }

  /**
   * 提取所有依赖关系
   */
  protected extractAllDependencies(rootNode: any, dependencies: Set<string>): void {
    this.extractDepsByQuery(rootNode, dependencies);
    this.extractDepsByWalking(rootNode, dependencies);
  }

  /**
   * 使用 tree-sitter 查询提取依赖
   */
  protected extractDepsByQuery(rootNode: any, dependencies: Set<string>): void {
    if (!this.parserConfig) return;

    try {
      const captures = this.parserConfig.query.captures(rootNode);
      captures.forEach((capture) => {
        // 只处理标记为 @dep 的捕获，忽略其他捕获（如 @attr.name）
        if (capture.name === 'dep') {
          const depPath = this.cleanDependencyPath(capture.node.text);
          if (this.isValidDependency(depPath)) {
            dependencies.add(depPath);
          }
        }
      });
    } catch (error) {
      console.warn('Query capture failed');
    }
  }

  /**
   * 通过 AST 遍历提取依赖（兜底方案）
   */
  protected extractDepsByWalking(node: any, dependencies: Set<string>): void {
    if (node.type === 'import_statement') {
      const strNode = node.childForFieldName('source');
      if (strNode) {
        const dep = this.cleanDependencyPath(strNode.text);
        if (this.isValidDependency(dep)) {
          dependencies.add(dep);
        }
      }
    }

    if (
      node.type === 'call_expression' &&
      node.firstChild?.text === 'require'
    ) {
      const arg = node.lastChild?.firstChild;
      if (arg) {
        const dep = this.cleanDependencyPath(arg.text);
        if (this.isValidDependency(dep)) {
          dependencies.add(dep);
        }
      }
    }

    if (node.children) {
      node.children.forEach((child: any) => this.extractDepsByWalking(child, dependencies));
    }
  }
}
