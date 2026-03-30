import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { FileProcessorFactory } from '../processors/processor-factory';
import { ParserManager } from '../parsers/parser-manager';
import { ScanOptions, DEFAULT_SCAN_OPTIONS, buildIgnorePatterns, shouldIgnorePath } from '../constants/scan-options';
import { frameworkToScanOptions, getFrameworkConfig } from '../constants/framework-config';
import { SupportedFramework } from '@/types/env';

/**
 * 扫描统计信息
 */
interface ScanStatistics {
  totalFilesScanned: number;
  filesSkipped: number;
  filesAnalyzed: number;
  directoriesScanned: number;
  errors: number;
}

/**
 * 智能依赖分析器
 * 统一的入口点，协调各个组件进行依赖分析
 */
export class DependencyAnalyzer {
  private factory: FileProcessorFactory;
  private parserManager: ParserManager;
  private scanOptions: ScanOptions;
  private statistics: ScanStatistics;
  private framework?: SupportedFramework;

  constructor(
    {
      parserPath,
      scanOptions
    }: {
      parserPath?: string,
      scanOptions: ScanOptions
    }
  ) {
    // 提取框架类型
    this.framework = scanOptions.framework;

    // 如果没有提供路径，则自动检测 WASM 文件位置
    const defaultParserPath = parserPath || this.detectParserPath();

    // 根据框架创建对应的处理器工厂
    this.factory = new FileProcessorFactory(this.framework);
    this.parserManager = new ParserManager(defaultParserPath);

    // 如果指定了框架，使用框架配置合并扫描选项
    if (this.framework) {
      const frameworkOptions = frameworkToScanOptions(this.framework);
      this.scanOptions = {
        ...frameworkOptions,
        ...scanOptions,
        // 确保框架设置不被覆盖
        framework: this.framework
      };
    } else {
      this.scanOptions = { ...DEFAULT_SCAN_OPTIONS, ...scanOptions };
    }

    this.statistics = {
      totalFilesScanned: 0,
      filesSkipped: 0,
      filesAnalyzed: 0,
      directoriesScanned: 0,
      errors: 0
    };

    // 如果指定了框架，打印框架信息
    if (this.framework) {
      const config = getFrameworkConfig(this.framework);
      console.log(`🎯 Framework: ${config.name} - ${config.description}`);
    }
  }

  /**
   * 自动检测 WASM 解析器文件路径
   */
  private detectParserPath(): string {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // 尝试多个可能的路径位置
    const testPath = path.join(__dirname, '..' , 'parsers');

    if (fs.existsSync(testPath)) {
      const files = fs.readdirSync(testPath);
      const hasWasmFiles = files.some(file => file.endsWith('.wasm'));
      if (hasWasmFiles) {
        console.log(`📂 Using parser path: ${testPath}`);
        return testPath;
      }
    }

    // 如果都找不到，使用默认路径
    const fallbackPath = path.join(process.cwd(), 'src', 'parsers');
    console.warn(`⚠️ Could not find WASM files, using fallback: ${fallbackPath}`);
    return fallbackPath;
  }

  /**
   * 初始化分析器
   */
  async initialize(): Promise<void> {
    try {
      await this.parserManager.initialize(this.factory.getAllProcessors());
      console.log('🚀 All parsers initialized (Vue SFC splitting enabled)');
    } catch (error: any) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * 设置扫描选项
   */
  setScanOptions(options: Partial<ScanOptions>): void {
    this.scanOptions = { ...this.scanOptions, ...options };
  }

  /**
   * 获取当前扫描选项
   */
  getScanOptions(): ScanOptions {
    return { ...this.scanOptions };
  }

  /**
   * 获取扫描统计信息
   */
  getStatistics(): ScanStatistics {
    return { ...this.statistics };
  }

  /**
   * 重置统计信息
   */
  resetStatistics(): void {
    this.statistics = {
      totalFilesScanned: 0,
      filesSkipped: 0,
      filesAnalyzed: 0,
      directoriesScanned: 0,
      errors: 0
    };
  }

  /**
   * 分析单个文件
   */
  analyzeFile(filePath: string): string[] {
    try {
      // 检查文件是否应该被忽略
      if (shouldIgnorePath(filePath, this.scanOptions)) {
        if (this.scanOptions.verbose) {
          console.log(`⏭️  Skipping ignored file: ${filePath}`);
        }
        this.statistics.filesSkipped++;
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const processor = this.factory.getProcessorForFile(filePath);

      if (!processor) {
        if (this.scanOptions.verbose) {
          console.warn(`⚠️ No processor found for: ${filePath}`);
        }
        this.statistics.filesSkipped++;
        return [];
      }

      const result = processor.analyze(filePath, content);
      this.statistics.filesAnalyzed++;

      if (this.scanOptions.verbose) {
        console.log(`✅ Analyzed: ${filePath} (${result.dependencies.length} dependencies)`);
      }

      return result.dependencies;
    } catch (error) {
      this.statistics.errors++;
      console.warn(`⚠️ [Skip] Cannot analyze file: ${filePath}`);
      return [];
    }
  }

  /**
   * 扫描目录并分析所有文件
   */
  scanDirectory(dir: string, options?: Partial<ScanOptions>): Record<string, string[]> {
    // 如果提供了选项，更新当前选项
    if (options) {
      this.setScanOptions(options);
    }

    // 重置统计信息
    this.resetStatistics();

    const absPath = path.resolve(dir).replace(/\\/g, '/');

    // 构建文件扩展名模式
    const extensions = this.scanOptions.extensions || DEFAULT_SCAN_OPTIONS.extensions || [];
    // 对于单个扩展名，使用 *.ext 格式；对于多个扩展名，使用 *.{ext1,ext2} 格式
    const extensionPattern = extensions.length === 1
      ? `**/*.${extensions[0]}`
      : `**/*.{${extensions.join(',')}}`;

    // 构建忽略模式
    const ignorePatterns = buildIgnorePatterns(this.scanOptions);

    if (this.scanOptions.verbose) {
      console.log(`🔍 Scanning directory: ${absPath}`);
      console.log(`📁 Extensions: ${(extensions || []).join(', ')}`);
      console.log(`🚫 Ignore patterns: ${ignorePatterns.length} patterns`);
    }

    const files = globSync(extensionPattern, {
      cwd: absPath,
      absolute: true,
      ignore: ignorePatterns
    });

    this.statistics.totalFilesScanned = files.length;

    if (this.scanOptions.verbose) {
      console.log(`📊 Found ${files.length} files to analyze`);
    }

    const result: Record<string, string[]> = {};

    files.forEach((file: string) => {
      try {
        let relPath = path.relative(absPath, file);
        // 统一使用正斜杠作为路径分隔符
        relPath = relPath.replace(/\\/g, '/');
        result[relPath] = this.analyzeFile(file);
      } catch (error) {
        if (this.scanOptions.verbose) {
          console.error(`❌ Error processing file: ${file}`, error);
        }
        this.statistics.errors++;
      }
    });

    // 打印统计信息
    if (this.scanOptions.verbose || files.length > 0) {
      console.log(`\n📈 Scan Statistics:`);
      console.log(`   Total files found: ${this.statistics.totalFilesScanned}`);
      console.log(`   Files analyzed: ${this.statistics.filesAnalyzed}`);
      console.log(`   Files skipped: ${this.statistics.filesSkipped}`);
      console.log(`   Errors: ${this.statistics.errors}`);
    }

    return result;
  }
}
