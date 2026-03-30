import * as path from 'path';

export interface RankedFile {
  filePath: string;
  imports: string[];   // 正向依赖：我引用了谁
  importedBy: string[];// 反向依赖：谁引用了我
}

export class PageRankReranker {
  /**
   * 🌟 纯净数据驱动版（严格修复版，无未定义变量）
   */
  public static rank(rawMap: Record<string, string[]>): RankedFile[] {
    const files = Object.keys(rawMap);
    if (files.length === 0) return [];

    // 1. 构建反向依赖字典 (计算谁引用了我)
    const importedBy: Record<string, string[]> = {};
    files.forEach(f => {
      importedBy[f] = [];
    });
    
    for (const [file, imports] of Object.entries(rawMap)) {
      imports.forEach(imp => {
        if (importedBy[imp]) {
          importedBy[imp].push(file);
        }
      });
    }

    // 2. 组装基础数据
    const result: RankedFile[] = files.map(file => ({
      filePath: file,
      imports: rawMap[file] || [],
      importedBy: importedBy[file] || []
    }));

    // 3. 🚀 纯粹的拓扑权重排序
    return result.sort((a, b) => {
      // 💥 维度一：被引用的次数（入度）
      const inDegreeA = a.importedBy.length;
      const inDegreeB = b.importedBy.length;
      if (inDegreeA !== inDegreeB) {
        // b 的入度减 a 的入度，实现从大到小降序
        return inDegreeB - inDegreeA; 
      }

      // 💥 维度二：主动引用的次数（出度）
      const outDegreeA = a.imports.length;
      const outDegreeB = b.imports.length;
      if (outDegreeA !== outDegreeB) {
        // b 的出度减 a 的出度，实现从大到小降序
        return outDegreeB - outDegreeA; 
      }

      // 💥 维度三：字母排序（保证排序稳定性，不随机）
      return a.filePath.localeCompare(b.filePath);
    });
  }

  /**
   * ✂️ 剪枝方法
   */
  public static getTopFiles(rankedList: RankedFile[], limit: number = 20): RankedFile[] {
    return rankedList.slice(0, limit);
  }
}