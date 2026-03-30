import { BaseFileProcessor } from './base-processor';
import { AnalysisResult } from '@/types/repo-map';

/**
 * Vue 单文件组件专用处理器
 * 处理 Vue SFC 格式的特殊逻辑
 */
export class VueFileProcessor extends BaseFileProcessor {
  private readonly SCRIPT_BLOCK_REGEX = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
  private readonly SCRIPT_CONTENT_REGEX = /<script\b[^>]*>([\s\S]*?)<\/script>/i;
  private readonly TYPESCRIPT_LANG_REGEX = /lang\s*=\s*["'](?:ts|tsx)["']/i;

  constructor() {
    super('vue');
  }

  analyze(filePath: string, content: string): AnalysisResult {
    const dependencies = new Set<string>();
    const scriptBlocks = this.extractScriptBlocks(content);

    let hasTypeScript = false;

    scriptBlocks.forEach(block => {
      const scriptContent = this.extractScriptContent(block);
      if (!scriptContent) return;

      const isTypeScript = this.isTypeScriptBlock(block);
      hasTypeScript = hasTypeScript || isTypeScript;

      const scriptDeps = this.extractScriptDependencies(scriptContent, isTypeScript);
      scriptDeps.forEach(dep => dependencies.add(dep));
    });

    return {
      dependencies: Array.from(dependencies),
      metadata: {
        language: 'vue',
        hasTypeScript,
        scriptBlocks: scriptBlocks.length
      }
    };
  }

  /**
   * 提取所有 script 标签块
   */
  private extractScriptBlocks(content: string): string[] {
    const matches = content.match(this.SCRIPT_BLOCK_REGEX);
    return matches || [];
  }

  /**
   * 从 script 标签中提取内容
   */
  private extractScriptContent(block: string): string | null {
    const match = block.match(this.SCRIPT_CONTENT_REGEX);
    return match ? match[1].trim() : null;
  }

  /**
   * 判断 script 标签是否使用 TypeScript
   */
  private isTypeScriptBlock(block: string): boolean {
    return this.TYPESCRIPT_LANG_REGEX.test(block);
  }

  /**
   * 从脚本内容中提取依赖关系
   */
  private extractScriptDependencies(scriptCode: string, isTypeScript: boolean): string[] {
    if (!this.parserConfig) {
      throw new Error('Parser config not set for Vue processor');
    }

    const dependencies = new Set<string>();

    // 使用 tree-sitter 查询
    const tree = this.parserConfig.parser.parse(scriptCode);
    if (tree) {
      this.extractDepsByQuery(tree.rootNode, dependencies);
      this.extractDepsByWalking(tree.rootNode, dependencies);
    }

    return Array.from(dependencies);
  }

  /**
   * 使用 tree-sitter 查询提取依赖
   */
  private extractDepsByQuery(rootNode: any, dependencies: Set<string>): void {
    if (!this.parserConfig) return;

    try {
      const captures = this.parserConfig.query.captures(rootNode);
      captures.forEach((capture) => {
        const depPath = this.cleanDependencyPath(capture.node.text);
        if (this.isValidDependency(depPath)) {
          dependencies.add(depPath);
        }
      });
    } catch (error) {
      console.warn('Query capture failed, using fallback method');
    }
  }

  /**
   * 通过 AST 遍历提取依赖（兜底方案）
   */
  private extractDepsByWalking(node: any, dependencies: Set<string>): void {
    // 处理 import 语句
    if (node.type === 'import_statement') {
      const strNode = node.childForFieldName('source');
      if (strNode) {
        const dep = this.cleanDependencyPath(strNode.text);
        if (this.isValidDependency(dep)) {
          dependencies.add(dep);
        }
      }
    }

    // 处理 require 调用
    if (this.isRequireCall(node)) {
      const dep = this.extractRequirePath(node);
      if (dep && this.isValidDependency(dep)) {
        dependencies.add(dep);
      }
    }

    // 递归处理子节点
    if (node.children) {
      node.children.forEach((child: any) => this.extractDepsByWalking(child, dependencies));
    }
  }

  /**
   * 判断是否为 require 调用
   */
  private isRequireCall(node: any): boolean {
    return (
      node.type === 'call_expression' &&
      node.firstChild?.text === 'require'
    );
  }

  /**
   * 从 require 调用中提取路径
   */
  private extractRequirePath(node: any): string | null {
    const arg = node.lastChild?.firstChild;
    return arg ? this.cleanDependencyPath(arg.text) : null;
  }
}
