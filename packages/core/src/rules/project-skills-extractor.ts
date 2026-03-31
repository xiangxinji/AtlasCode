import { ProjectUtils } from '@/utils/project-utils';
import * as fs from 'fs';
import * as path from 'path';

interface CacheEntry {
  content: string;
  mtime: number;
}

// 🌟 1. 结构体彻底瘦身：绝不包含沉重的 content
export interface SkillMenuItem {
  name: string;
  description: string;
  path: string; // 供 Agent 顺藤摸瓜的路径
}

/**
 * 项目技能提取器
 * 职责：根据动态路径，为 Agent 提取技能文件的菜单索引，绝不返回具体内容。
 */
export class ProjectSkillsExtractor {
  private projectPath: string;
  
  // 保持内存缓存，避免 Agent 频繁调用工具导致磁盘 I/O 爆炸
  private static fileCache: Map<string, CacheEntry> = new Map();

  constructor(projectPath: string) {
    // 🌟 使用工具：路径归一化
    this.projectPath = ProjectUtils.normalizePath(path.resolve(projectPath));
  }

  /**
   * 🌟 核心方法：根据外部传入的动态路径，读取技能文件并组装菜单
   * @param relativeOrAbsPath 技能文件夹或具体文件的路径
   */
  public extract(relativeOrAbsPath: string): Record<string, SkillMenuItem> {
    const result: Record<string, SkillMenuItem> = {};

    // 1. 计算出绝对路径
    const targetPath = path.isAbsolute(relativeOrAbsPath)
      ? ProjectUtils.normalizePath(relativeOrAbsPath)
      : ProjectUtils.normalizePath(path.join(this.projectPath, relativeOrAbsPath));

    // 2. 场景 A：如果传入的是一个具体的技能文件
    if (fs.existsSync(targetPath) && !ProjectUtils.isDirectory(targetPath)) {
      const content = this.readFileWithCache(targetPath);
      if (content) {
        const fileName = path.basename(targetPath);
        result[fileName] = this.assembleSkillMenu(fileName, targetPath, content);
      }
      return result;
    }

    // 3. 场景 B：如果传入的是一个文件夹，扫描并读取
    if (ProjectUtils.isDirectory(targetPath)) {
      try {
        const files = fs.readdirSync(targetPath);
        for (const file of files) {
          // 仅读取常见文本/Markdown 技能格式
          if (file.endsWith('.md') || file.endsWith('.mdc') || file.endsWith('.txt')) {
            const fullFilePath = path.join(targetPath, file);
            const content = this.readFileWithCache(fullFilePath);
            if (content) {
              result[file] = this.assembleSkillMenu(file, fullFilePath, content);
            }
          }
        }
      } catch (error) {
        console.error(`❌ [SkillsExtractor] 扫描目录失败: ${targetPath}`, error);
      }
    }

    return result;
  }

  /**
   * 🛡️ 缓存读取：原封不动读取，不做任何 trim 或解析
   */
  private readFileWithCache(fullPath: string): string | undefined {
    try {
      const stats = fs.statSync(fullPath);
      const currentMtime = stats.mtimeMs;

      // 🔍 命中缓存
      const cachedItem = ProjectSkillsExtractor.fileCache.get(fullPath);
      if (cachedItem && cachedItem.mtime === currentMtime) {
        return cachedItem.content;
      }

      // 💾 重新读盘
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      ProjectSkillsExtractor.fileCache.set(fullPath, {
        content: content,
        mtime: currentMtime
      });

      return content;
    } catch (error) {
      console.error(`❌ [SkillsExtractor] 读取文件失败: ${fullPath}`, error);
    }
    return undefined;
  }

  /**
   * 🧩 2. 组装方法：只提取元数据 + 路径，干掉 content
   */
  private assembleSkillMenu(fileName: string, fullPath: string, content: string): SkillMenuItem {
    let name = fileName;
    let description = '暂无描述';

    // 提取 Markdown 头部 YAML 里的 name 和 description
    const frontmatterRegex = /^---([\s\S]*?)---/;
    const match = content.match(frontmatterRegex);

    if (match) {
      const yamlBlock = match[1];
      const lines = yamlBlock.split('\n');
      
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
          if (key.trim() === 'name') name = value;
          if (key.trim() === 'description') description = value;
        }
      });
    } else {
      // 如果没有 YAML，拿前几行作为后备
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      if (lines[0]) name = lines[0].replace(/^#+\s*/, '').trim();
      if (lines[1]) description = lines[1].trim();
    }

    // 🌟 返回给 AI 的 ACI 专用路径（使用工具类转为相对路径，保持清爽）
    const cleanPath = ProjectUtils.getRelativePath(this.projectPath, fullPath);

    return {
      name,
      description,
      path: cleanPath // 👈 供 Agent 顺藤摸瓜 F12 的关键
    };
  }
}