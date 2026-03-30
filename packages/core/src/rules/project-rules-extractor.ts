import * as fs from 'fs';
import * as path from 'path';

// 1. 定义统一吐给 AI 消费的规则契约
export interface ProjectRules {
  readme?: string;
  claudeMd?: string;
  // 汇总后的黄金法则：如果 claudeMd 存在，AI 应该绝对优先遵循它
  activeRules: string; 
}

export class ProjectRulesExtractor {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
  }

  /**
   * 🌟 核心方法：同时读取 README 和 CLAUDE.md
   */
  public extract(): ProjectRules {
    const readmeContent = this.readFileIgnoringCase(['README.md', 'readme.md', 'Readme.md']);
    const claudeContent = this.readFileIgnoringCase(['CLAUDE.md', 'claude.md', 'Claude.md']);

    // 2. 制定 AI 的“最高指示”
    // 规则：如果两个都有，把它们拼起来；如果只有其一，就用其一
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
   * 辅助方法：忽略大小写寻找并读取文件
   */
  private readFileIgnoringCase(possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      const fullPath = path.join(this.projectPath, name);
      if (fs.existsSync(fullPath)) {
        try {
          return fs.readFileSync(fullPath, 'utf-8');
        } catch (error) {
          console.error(`❌ 读取文件 ${name} 失败:`, error);
        }
      }
    }
    return undefined;
  }
}