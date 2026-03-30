import { Parser, Query, Language } from 'web-tree-sitter';
import * as fs from 'fs';
import * as path from 'path';
import { QUERIES, WASM_FILES } from '../constants/queries';
import { BaseFileProcessor } from '../processors/base-processor';
import { ParserConfig } from '@/types/repo-map';

/**
 * 解析器管理器
 * 负责 tree-sitter 解析器的初始化和配置
 */
export class ParserManager {
  private parsers: Record<string, ParserConfig> = {};
  private readonly wasmPath: string;

  constructor(wasmPath: string) {
    this.wasmPath = wasmPath;
  }

  /**
   * 初始化所有解析器
   */
  async initialize(processors: BaseFileProcessor[]): Promise<void> {
    await Parser.init();

    const initPromises = processors.map(processor =>
      this.initializeParser(processor).catch(error => {
        console.warn(`Failed to initialize ${processor.getExtension()} parser:`, error.message);
      })
    );

    await Promise.all(initPromises);
  }

  /**
   * 初始化单个解析器
   */
  private async initializeParser(processor: BaseFileProcessor): Promise<void> {
    const ext = processor.getExtension();

    // Vue 文件使用 JS 解析器
    if (ext === 'vue') {
      const jsConfig = await this.loadParser('js', QUERIES.js);
      processor.setParserConfig(jsConfig);
      return;
    }

    // 其他语言使用对应的解析器
    const wasmFile = WASM_FILES[ext as keyof typeof WASM_FILES];
    if (!wasmFile) {
      throw new Error(`No WASM file configured for ${ext}`);
    }

    const query = QUERIES[ext];
    if (!query) {
      throw new Error(`No query configured for ${ext}`);
    }

    const config = await this.loadParser(ext, query);
    processor.setParserConfig(config);
  }

  /**
   * 加载解析器
   */
  private async loadParser(name: string, queryStr: string): Promise<ParserConfig> {
    if (this.parsers[name]) {
      return this.parsers[name];
    }

    const wasmFile = WASM_FILES[name as keyof typeof WASM_FILES] || `${name}.wasm`;
    const wasmPath = path.join(this.wasmPath, wasmFile);

    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found: ${wasmPath}`);
    }

    const wasmBuffer = fs.readFileSync(wasmPath);
    const lang = await Language.load(wasmBuffer);

    const parser = new Parser();
    parser.setLanguage(lang);

    const config: ParserConfig = {
      parser,
      query: new Query(lang, queryStr),
      lang
    };

    this.parsers[name] = config;
    console.log(`✅ ${name} parser loaded successfully`);

    return config;
  }
}
