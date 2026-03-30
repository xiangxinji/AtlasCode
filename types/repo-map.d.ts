import { Parser, Query, Language } from 'web-tree-sitter';

/**
 * 解析器配置接口
 */
export interface ParserConfig {
    parser: Parser;
    query: Query;
    lang: Language;
}

/**
 * 查询配置接口
 */
export interface QueryConfig {
    [key: string]: string;
}

/**
 * 分析结果接口
 */
export interface AnalysisResult {
    dependencies: string[];
    metadata?: {
        language: string;
        hasTypeScript?: boolean;
        scriptBlocks?: number;
    };
}

/**
 * WASM 文件配置接口
 */
export interface WasmFileConfig {
    [key: string]: string;
}


