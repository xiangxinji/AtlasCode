import * as fs from 'fs';
import * as path from 'path';

export interface ProjectRules {
  readme?: string;
  claudeMd?: string;
  activeRules: string; 
}

// 1. 定义缓存条目的结构
interface CacheEntry {
  content: string | undefined;
  mtime: number; // 上次文件的修改时间戳
}

/**
 * 项目规则提取器
 * 负责从项目根目录读取 README.md 和 CLAUDE.md 文件，合并为一个字符串
 */
export class ProjectRulesExtractor {
  private projectPath: string;
  
  // 2. 建立内存缓存字典
  private static fileCache: Map<string, CacheEntry> = new Map();

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
  }

  /**
   * 🌟 核心方法：同时读取 README 和 CLAUDE.md（带智能缓存）
   */
  public extract(): ProjectRules {
    const readmeContent = this.readFileWithCache(['README.md', 'readme.md', 'Readme.md']);
    const claudeContent = this.readFileWithCache(['CLAUDE.md', 'claude.md', 'Claude.md']);

    let activeRules = '';
    
    if (claudeContent) {
      activeRules += `=== AI 行为准则 (来自 CLAUDE.md) ===\n${claudeContent}\n\n`;
    }
    
    if (readmeContent) {
      activeRules += `=== 项目背景与说明 (来自 README.md) ===\n${readmeContent}`;
    }

    return {
      readme: readmeContent,
      claudeMd: claudeContent,
      activeRules: activeRules.trim()
    };
  }

  /**
   * 🛡️ 核心缓存逻辑：对比文件的 mtime
   */
  private readFileWithCache(possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      const fullPath = path.join(this.projectPath, name);
      
      if (fs.existsSync(fullPath)) {
        try {
          const stats = fs.statSync(fullPath);
          const currentMtime = stats.mtimeMs; // 获取当前文件的毫秒级修改时间

          // 🔍 命中了缓存，且文件在这期间没有被修改过
          const cachedItem = ProjectRulesExtractor.fileCache.get(fullPath);
          if (cachedItem && cachedItem.mtime === currentMtime) {
            // console.log(`🚀 [Cache Hit] 命中缓存: ${name}`);
            return cachedItem.content;
          }

          // 💾 未命中，或者文件被改过了：重新读盘并更新缓存
          // console.log(`💾 [Cache Miss/Dirty] 重新读盘: ${name}`);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          ProjectRulesExtractor.fileCache.set(fullPath, {
            content: content,
            mtime: currentMtime
          });

          return content;
        } catch (error) {
          console.error(`❌ 读取文件 ${name} 失败:`, error);
        }
      }
    }
    return undefined;
  }
}