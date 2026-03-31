import { SupportedFramework } from '@/types/env';
import * as path from 'path';

/**
 * 扫描选项配置接口
 * 简化版：所有忽略模式都通过 ignorePatterns 配置
 */
export interface ScanOptions {
  /**
   * 框架类型，用于自动应用框架特定的配置
   */
  framework?: SupportedFramework;

  /**
   * 要忽略的目录模式列表
   * 当指定 framework 时，会自动包含框架的内置忽略模式
   */
  ignorePatterns?: string[];

  /**
   * 是否显示详细的扫描信息
   */
  verbose?: boolean;

  /**
   * 要分析的文件扩展名
   * 当指定 framework 时，会自动使用框架推荐的扩展名
   */
  extensions?: string[];
}

/**
 * 默认扫描选项
 * 不指定框架时的保守默认值
 */
export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  ignorePatterns: [],
  verbose: false,
  extensions: ['js', 'ts', 'vue', 'java', 'css', 'scss', 'less', 'jsx', 'tsx']
};

/**
 * 构建完整的忽略模式列表
 * 将所有忽略模式统一处理
 */
export function buildIgnorePatterns(options: ScanOptions): string[] {
  const patterns: string[] = [];

  // 添加用户自定义的忽略模式
  if (options.ignorePatterns) {
    patterns.push(...options.ignorePatterns);
  }

  return patterns;
}



export function shouldIgnorePath(filePath: string, options: ScanOptions): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // 检查是否匹配 ignorePatterns
  if (options.ignorePatterns && options.ignorePatterns.length > 0) {
    return options.ignorePatterns.some(pattern => {
      // 将 glob 模式转换为正则表达式进行简单匹配
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      const regex = new RegExp(regexPattern);
      return regex.test(normalizedPath);
    });
  }

  return false;
}