import { simpleGit, SimpleGit } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';

export interface GitStatus {
  isRepo: boolean;
  currentBranch: string;
  modifiedFiles: string[]; 
  hotFiles: string[];      
}

export class GitExtractor {
  private projectPath: string;
  private git: SimpleGit;

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
    this.git = simpleGit(this.projectPath);
    
    // 🛡️ 极速防错补丁：强制 Git 在输出时不转义中文路径（解决 Windows 11 下的中文乱码问题）
    // 这行命令没有任何副作用，但能保证 AI Agent 拿到的文件名绝对是人类可读的
    this.git.addConfig('core.quotepath', 'false');
  }

  /**
   * 🌟 核心方法 1：一键获取当前 Git 的动态快照
   */
  public async extract(hotCommitLimit: number = 5): Promise<GitStatus> {
    const isRepo = fs.existsSync(path.join(this.projectPath, '.git'));
    if (!isRepo) {
      return { isRepo: false, currentBranch: '', modifiedFiles: [], hotFiles: [] };
    }

    try {
      const [branch, status] = await Promise.all([
        this.git.revparse(['--abbrev-ref', 'HEAD']),
        this.git.status()
      ]);

      // 这里直接拿到的文件路径就是完美解析过的
      const modifiedFiles = status.files.map(file => file.path);
      const hotFiles = await this.getHotFiles(hotCommitLimit);

      return {
        isRepo: true,
        currentBranch: branch.trim(),
        modifiedFiles,
        hotFiles
      };
    } catch (error) {
      console.error('❌ 提取 Git 信息失败:', error);
      return { isRepo: true, currentBranch: 'unknown', modifiedFiles: [], hotFiles: [] };
    }
  }

  /**
   * 🌟 核心方法 2：获取指定文件的 Diff 内容
   */
  public async getFileDiff(filePath: string): Promise<string> {
    try {
      return await this.git.diff(['HEAD', '--', filePath]);
    } catch (error) {
      console.error(`❌ 获取文件 ${filePath} 的 Diff 失败:`, error);
      return '';
    }
  }

  /**
   * 🔥 获取热点文件（严格无死角、无垃圾变量版）
   */
  private async getHotFiles(limit: number): Promise<string[]> {
    try {
      const rawLog = await this.git.raw(['log', `-${limit}`, '--format=', '--name-only']);
      
      const fileCounts: Record<string, number> = {};
      const lines = rawLog.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed !== '') {
          fileCounts[trimmed] = (fileCounts[trimmed] || 0) + 1;
        }
      }

      return Object.keys(fileCounts).sort((a, b) => fileCounts[b] - fileCounts[a]);
    } catch {
      return [];
    }
  }
}