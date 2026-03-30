import * as path from 'path';
import { BaseFileProcessor } from './base-processor';
import { VueFileProcessor } from './vue-processor';
import { JavaScriptFileProcessor } from './js-processor';
import { TypeScriptFileProcessor } from './ts-processor';
import { JavaFileProcessor } from './java-processor';
import { HtmlFileProcessor } from './html-processor';
import { CssFileProcessor } from './css-processor';
import { ScssFileProcessor } from './scss-processor';
import { LessFileProcessor } from './less-processor';
import { SupportedFramework } from '@/types/env';

/**
 * 文件处理器工厂
 * 负责创建和管理文件处理器实例
 */
export class FileProcessorFactory {
  private processors: Map<string, BaseFileProcessor> = new Map();

  constructor(framework?: SupportedFramework) {
    this.registerProcessorsForFramework(framework);
  }

  /**
   * 根据框架注册对应的文件处理器
   */
  private registerProcessorsForFramework(framework?: SupportedFramework): void {
    if (framework) {
      // 根据框架只注册需要的处理器
      this.registerProcessorsByFramework(framework);
    } else {
      // 如果没有指定框架，注册所有处理器（向后兼容）
      this.registerDefaultProcessors();
    }
  }

  /**
   * 根据框架类型注册对应的处理器
   */
  private registerProcessorsByFramework(framework: SupportedFramework): void {
    switch (framework) {
      case 'vue':
        // Vue 框架需要的处理器（包含 HTML）
        this.register(new VueFileProcessor());
        this.register(new JavaScriptFileProcessor());
        this.register(new TypeScriptFileProcessor());
        this.register(new HtmlFileProcessor());     // HTML 支持
        this.register(new CssFileProcessor());
        this.register(new ScssFileProcessor());
        this.register(new LessFileProcessor());
        break;

      case 'node':
        // Node.js 框架需要的处理器（包含 HTML）
        this.register(new JavaScriptFileProcessor());
        this.register(new TypeScriptFileProcessor());
        this.register(new HtmlFileProcessor());     // HTML 支持
        this.register(new CssFileProcessor());
        this.register(new ScssFileProcessor());
        this.register(new LessFileProcessor());
        break;

      case 'java':
        // Java 框架只需要 Java 处理器
        this.register(new JavaFileProcessor());
        break;

      default:
        // 未知框架，注册所有处理器
        this.registerDefaultProcessors();
    }
  }

  /**
   * 注册默认的文件处理器（所有类型）
   */
  private registerDefaultProcessors(): void {
    this.register(new VueFileProcessor());
    this.register(new JavaScriptFileProcessor());
    this.register(new TypeScriptFileProcessor());
    this.register(new JavaFileProcessor());
    this.register(new HtmlFileProcessor());        // HTML 支持
    this.register(new CssFileProcessor());
    this.register(new ScssFileProcessor());
    this.register(new LessFileProcessor());
  }

  /**
   * 注册新的文件处理器
   */
  register(processor: BaseFileProcessor): void {
    this.processors.set(processor.getExtension(), processor);
  }

  /**
   * 根据文件扩展名获取对应的处理器
   */
  getProcessor(extension: string): BaseFileProcessor | undefined {
    return this.processors.get(extension);
  }

  /**
   * 根据文件路径获取对应的处理器
   */
  getProcessorForFile(filePath: string): BaseFileProcessor | undefined {
    const ext = path.extname(filePath).slice(1);
    return this.getProcessor(ext);
  }

  /**
   * 获取所有已注册的处理器
   */
  getAllProcessors(): BaseFileProcessor[] {
    return Array.from(this.processors.values());
  }
}
