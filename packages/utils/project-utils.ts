import * as fs from 'fs';
import * as path from 'path';

/**
 * 🌟 核心工程工具库：
 * 为 ProjectDetector、DirectoryTreeBuilder 和所有分析器提供底层原子操作。
 */
export class ProjectUtils {
  
  /**
   * 1. 统一路径分隔符为正斜杠 '/'
   * 解决 Windows 11 下反斜杠 `\` 导致 AI 路径理解混乱、正则失效以及 Glob 匹配失败的问题。
   */
  public static normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * 2. 安全读取 JSON 文件
   * 避免 JSON.parse 报错导致整个智能体进程崩溃。
   */
  public static readJsonSafe<T = any>(filePath: string): T | null {
    if (!fs.existsSync(filePath)) return null;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`❌ [Utils] 解析 JSON 失败: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 3. 检查一组特征文件是否至少存在一个
   * 用于快速推断项目类型（如 hasMaven || hasGradle）。
   */
  public static hasAnyFile(baseDir: string, fileNames: string[]): boolean {
    return fileNames.some(fileName => fs.existsSync(path.join(baseDir, fileName)));
  }

  /**
   * 4. 检查目录是否存在（严格模式）
   * 避免将普通文件误判为目录。
   */
  public static isDirectory(fullPath: string): boolean {
    try {
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 5. 计算安全的相对路径
   * 专门用于给 AI 吐出极简、干净的 ACI 路径。
   */
  public static getRelativePath(from: string, to: string): string {
    const rel = path.relative(from, to);
    return this.normalizePath(rel);
  }
}