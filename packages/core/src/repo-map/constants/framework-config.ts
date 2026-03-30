import { ScanOptions } from './scan-options';

/**
 * 支持的框架类型
 */
export type Framework = 'vue' | 'node' | 'java';

/**
 * 框架特定的配置接口
 */
export interface FrameworkConfig {
  /** 框架名称 */
  name: string;
  /** 框架描述 */
  description: string;
  /** 支持的文件扩展名 */
  extensions: string[];
  /** 需要的解析器类型 */
  parsers: string[];
  /** 框架特定的忽略模式（包含所有内置的忽略规则） */
  ignorePatterns: string[];
}

/**
 * 内置的通用忽略模式
 */
const COMMON_IGNORE_PATTERNS = [
  '**/.vscode/**',
  '**/.idea/**',
  '**/.git/**',
  '**/.svn/**',
  '**/.hg/**'
];

/**
 * Node.js 生态的忽略模式
 */
const NODEJS_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/node_modules',
  '**/dist/**',
  '**/lib/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.output/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.bundle.js',
  '**/*.chunk.js'
];

/**
 * Java 生态的忽略模式
 */
const JAVA_IGNORE_PATTERNS = [
  '**/target/**',
  '**/build/**',
  '**/out/**',
  '**/.gradle/**',
  '**/gradle/**',
  '**/.mvn/**',
  '**/mvnw/**',
  '**/.settings/**',
  '**/bin/**',
  '**/generated/**',
  '**/*.class'
];

/**
 * 各框架的配置定义
 */
export const FRAMEWORK_CONFIGS: Record<Framework, FrameworkConfig> = {
  vue: {
    name: 'Vue',
    description: 'Vue.js 项目配置',
    extensions: ['js', 'ts', 'jsx', 'tsx', 'vue', 'html', 'css', 'scss', 'less'],
    parsers: ['js', 'ts', 'vue', 'html', 'css', 'scss', 'less'],
    ignorePatterns: [
      ...COMMON_IGNORE_PATTERNS,
      ...NODEJS_IGNORE_PATTERNS,
      '**/node_modules/.vite/**',
      '**/node_modules/.cache/**'
    ]
  },

  node: {
    name: 'Node.js',
    description: 'Node.js 项目配置',
    extensions: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less', 'json'],
    parsers: ['js', 'ts', 'html', 'css', 'scss', 'less'],
    ignorePatterns: [
      ...COMMON_IGNORE_PATTERNS,
      ...NODEJS_IGNORE_PATTERNS,
      '**/node_modules/.cache/**'
    ]
  },

  java: {
    name: 'Java',
    description: 'Java 项目配置',
    extensions: ['java'],
    parsers: ['java'],
    ignorePatterns: [
      ...COMMON_IGNORE_PATTERNS,
      ...JAVA_IGNORE_PATTERNS
    ]
  }
};

/**
 * 获取框架配置
 */
export function getFrameworkConfig(framework: Framework): FrameworkConfig {
  return FRAMEWORK_CONFIGS[framework];
}

/**
 * 将框架配置转换为扫描选项
 */
export function frameworkToScanOptions(framework: Framework): ScanOptions {
  const config = getFrameworkConfig(framework);

  return {
    extensions: config.extensions,
    ignorePatterns: config.ignorePatterns,
    verbose: false
  };
}

/**
 * 获取框架需要的解析器列表
 */
export function getFrameworkParsers(framework: Framework): string[] {
  return FRAMEWORK_CONFIGS[framework].parsers;
}

/**
 * 验证框架类型
 */
export function isValidFramework(value: string): value is Framework {
  return ['vue', 'node', 'java'].includes(value);
}

/**
 * 自动检测项目框架（基于项目文件）
 */
export function detectProjectFramework(projectPath: string): Framework | null {
  const fs = require('fs');
  const path = require('path');

  // 检查 Vue 项目
  if (fs.existsSync(path.join(projectPath, 'vue.config.js')) ||
      fs.existsSync(path.join(projectPath, 'vite.config.js')) ||
      fs.existsSync(path.join(projectPath, 'nuxt.config.js')) ||
      fs.existsSync(path.join(projectPath, 'package.json'))) {
    const packageJson = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJson)) {
      try {
        const content = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        if (content.dependencies?.vue || content.devDependencies?.vue) {
          return 'vue';
        }
      } catch (e) {
        // 忽略错误，继续检查
      }
    }
    return 'node'; // 有 package.json 但没有 Vue 依赖
  }

  // 检查 Java 项目
  if (fs.existsSync(path.join(projectPath, 'pom.xml')) ||
      fs.existsSync(path.join(projectPath, 'build.gradle')) ||
      fs.existsSync(path.join(projectPath, 'build.gradle.kts'))) {
    return 'java';
  }

  // 检查是否有 src/main/java 目录结构（Maven/Gradle 项目）
  const srcMainJava = path.join(projectPath, 'src', 'main', 'java');
  if (fs.existsSync(srcMainJava)) {
    return 'java';
  }

  return null; // 无法自动检测
}
