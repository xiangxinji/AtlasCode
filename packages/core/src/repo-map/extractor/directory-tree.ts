import * as fs from 'fs';
import * as path from 'path';
import { ScanOptions, shouldIgnorePath } from '../analyzer/constants/scan-options';

export class DirectoryTreeBuilder {
  private projectDir: string;
  private scanOptions: ScanOptions;

  constructor(projectDir: string, scanOptions: ScanOptions) {
    this.projectDir = path.resolve(projectDir).replace(/\\/g, '/');
    this.scanOptions = scanOptions;
  }

  /**
   * 🌟 核心入口：获取格式化后的树状字符串
   * @param maxDepth 限制树的深度，防止超大项目撑爆 Token，默认最多走 5 层
   */
  public getTreeString(maxDepth: number = 5): string {
    const baseName = path.basename(this.projectDir);
    let output = `${baseName}/\n`;
    output += this.buildTree(this.projectDir, '', 1, maxDepth);
    return output;
  }

  /**
   * 🔍 递归构建树
   */
  private buildTree(currentPath: string, prefix: string, currentDepth: number, maxDepth: number): string {
    if (currentDepth > maxDepth) return '';

    try {
      const items = fs.readdirSync(currentPath);
      
      // 1. 过滤并排序（文件夹排在前面，文件排在后面，符合人类阅读习惯）
      const validItems = items
        .map(item => {
          const fullPath = path.join(currentPath, item).replace(/\\/g, '/');
          return {
            name: item,
            fullPath,
            isDir: fs.statSync(fullPath).isDirectory()
          };
        })
        .filter(item => {
          // 🔥 联动你之前的 scanOptions，自动忽略 node_modules、.git 等
          return !shouldIgnorePath(item.fullPath, this.scanOptions);
        })
        .sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });

      let result = '';
      const total = validItems.length;

      validItems.forEach((item, index) => {
        const isLast = index === total - 1;
        const pointer = isLast ? '└── ' : '├── ';
        
        // 拼接当前层级
        result += `${prefix}${pointer}${item.name}${item.isDir ? '/' : ''}\n`;

        // 如果是目录，递归往下走
        if (item.isDir) {
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          result += this.buildTree(item.fullPath, nextPrefix, currentDepth + 1, maxDepth);
        }
      });

      return result;
    } catch (error) {
      // 遇到权限问题或死链接，安全跳过
      return '';
    }
  }
}