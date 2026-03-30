
export interface DependencyNode {
  filePath: string;
  id: string;
  imports: string[];
  importedBy: string[];
}

export class RepoMapExtractor {


  /**
   * 🌟 核心方法：把你的原生 map 转化为 ACI 协议标准格式（严谨修复版）
   * @param rawMap 你跑出来的 { 'a.vue': ['b.ts'] } 原始数据
   */
  public buildStandardMap(rawMap: Record<string, string[]>): Record<string, DependencyNode> {
    const standardMap: Record<string, DependencyNode> = {};

    // 1. 第一步：把所有【作为 Key 出现的文件】和【被引用的文件】全部注册到图中
    // 彻底解决因为 rawMap 漏掉 Key 导致文件在图里凭空消失的问题
    for (const [file, imports] of Object.entries(rawMap)) {
      this.ensureNodeExists(standardMap, file);

      for (const importFile of imports) {
        this.ensureNodeExists(standardMap, importFile);

        // 建立正向引用
        if (!standardMap[file].imports.includes(importFile)) {
          standardMap[file].imports.push(importFile);
        }
      }
    }

    // 2. 第二步：扫描全图，自动计算反向依赖 (ImportedBy)
    for (const [file, node] of Object.entries(standardMap)) {
      for (const importFile of node.imports) {
        // 因为第一步已经保证了节点 100% 存在，这里可以直接 push
        if (!standardMap[importFile].importedBy.includes(file)) {
          standardMap[importFile].importedBy.push(file);
        }
      }
    }

    return standardMap;
  }

  /**
   * 🏆 修复版排序：与你认可的 Rerank 逻辑对齐
   * 采用 入度 -> 出度 -> 字母 的纯净三重排序，消灭“全0平手”
   */
  public sortByImportance(standardMap: Record<string, DependencyNode>): string[] {
    return Object.keys(standardMap).sort((a, b) => {
      const nodeA = standardMap[a];
      const nodeB = standardMap[b];

      // 💥 维度一：被引用的次数（入度）
      const inDegreeA = nodeA.importedBy.length;
      const inDegreeB = nodeB.importedBy.length;
      if (inDegreeA !== inDegreeB) {
        return inDegreeB - inDegreeA; // 降序
      }

      // 💥 维度二：主动引用的次数（出度）
      const outDegreeA = nodeA.imports.length;
      const outDegreeB = nodeB.imports.length;
      if (outDegreeA !== outDegreeB) {
        return outDegreeB - outDegreeA; // 降序
      }

      // 💥 维度三：字母排序保证稳定性
      return a.localeCompare(b);
    });
  }

  /**
   * 辅助方法：确保节点一定在字典中初始化
   */
  private ensureNodeExists(map: Record<string, DependencyNode>, filePath: string): void {
    if (!map[filePath]) {
      map[filePath] = {
        filePath: filePath,
        id: filePath,
        imports: [],
        importedBy: []
      };
    }
  }
}