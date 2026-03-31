import { ProjectUtils } from '@/utils/project-utils';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectRules {
  readme?: string;
  claudeMd?: string;
}

interface CacheEntry {
  content: string;
  mtime: number;
}

/**
 * 项目规则提取器
 * 负责从项目根目录安全、高效地按需读取 README.md 和 CLAUDE.md 文件
 */
export class ProjectRulesExtractor {
  private projectPath: string;
  
  // 保持静态字典以支持跨实例缓存
  private static fileCache: Map<string, CacheEntry> = new Map();

  constructor(projectPath: string) {
    // 🌟 使用工具：路径归一化
    this.projectPath = ProjectUtils.normalizePath(path.resolve(projectPath));
  }

  /**
   * 🌟 1. 单独获取 README 的内容
   */
  public getReadme(): string | undefined {
    return this.readFileWithCache(['README.md', 'readme.md', 'Readme.md']);
  }

  /**
   * 🌟 2. 单独获取 CLAUDE.md 的内容
   */
  public getClaudeMd(): string | undefined {
    return this.readFileWithCache(['CLAUDE.md', 'claude.md', 'Claude.md']);
  }

  /**
   * 🌟 3. 获取纯净的结构化数据（不再拼接字符串）
   */
  public extract(): ProjectRules {
    return {
      readme: this.getReadme(),
      claudeMd: this.getClaudeMd()
    };
  }

  /**
   * 🛡️ 核心缓存逻辑：对比文件的 mtime
   */
  private readFileWithCache(possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      const fullPath = path.join(this.projectPath, name);
      
      // 🌟 使用工具：判断是否为真实存在的文件/目录
      if (!fs.existsSync(fullPath) || ProjectUtils.isDirectory(fullPath)) {
        continue;
      }

      try {
        const stats = fs.statSync(fullPath);
        const currentMtime = stats.mtimeMs;

        // 🔍 命中了缓存，且文件在这期间没有被修改过
        const cachedItem = ProjectRulesExtractor.fileCache.get(fullPath);
        if (cachedItem && cachedItem.mtime === currentMtime) {
          return cachedItem.content;
        }

        // 💾 未命中，或者文件被改过了：重新读盘
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        ProjectRulesExtractor.fileCache.set(fullPath, {
          content: content,
          mtime: currentMtime
        });

        return content;
      } catch (error) {
        console.error(`❌ [RulesExtractor] 读取文件 ${name} 失败:`, error);
      }
    }
    return undefined;
  }
}