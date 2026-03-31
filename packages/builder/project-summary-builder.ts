import * as path from 'path';
import { ProjectRulesExtractor } from '@/core/src';
// 🌟 引入 SkillMenuItem 类型
import { ProjectSkillsExtractor } from '@/core/src';
import { ProjectUtils } from '@/utils/project-utils';
import { ProjectDetector } from '@/core/src';
import { DirectoryTreeBuilder } from '@/core/src';
import { SkillMenuItem } from '@/core/src';
import { ScanOptions } from '@/core/src/repo-map/analyzer/constants/scan-options';

export interface ProjectSummarySnapshot {
    framework: string;
    readme?: string;
    claude?: string;
    /**
     * 项目目录树
     */
    directoryTree?: string;
    /**
     * 项目技能：现在只提供 name, description 和 path
     */
    skills: Record<string, SkillMenuItem>;
}

/**
 * 项目摘要构建器
 * 职责：负责把 Detector、Rules、DirectoryTree 和 Skills 组装成一份纯粹的数据快照，喂给架构师 Agent。
 */
export class ProjectSummaryBuilder {
    private projectPath: string;
    private detector: ProjectDetector;
    private rulesExtractor: ProjectRulesExtractor;
    private skillsExtractor: ProjectSkillsExtractor;
    private treeBuilder: DirectoryTreeBuilder;

    constructor(projectPath: string, scanOptions: ScanOptions) {
        // 🌟 使用工具：路径归一化
        this.projectPath = ProjectUtils.normalizePath(path.resolve(projectPath));

        // 初始化基础积木
        this.detector = new ProjectDetector(this.projectPath);
        this.rulesExtractor = new ProjectRulesExtractor(this.projectPath);
        this.skillsExtractor = new ProjectSkillsExtractor(this.projectPath);

        // 🌟 传入默认的 ScanOptions，确保 treeBuilder 有防御 node_modules 和 .git 的能力
        this.treeBuilder = new DirectoryTreeBuilder(this.projectPath, scanOptions);
    }

    /**
     * 🌟 核心方法：组装出纯净的结构化 Summary
     * @param skillsPath 动态的技能读取路径
     */
    public build({ skillsPath = '.agents/skills' }: { skillsPath?: string } = {}): ProjectSummarySnapshot {
        // 1. 获取项目框架
        const framework = this.detector.detect();

        // 2. 获取项目规则（README / CLAUDE.md）
        const rules = this.rulesExtractor.extract();

        // 3. 动态获取项目技能（菜单模式：无 content）
        const skills = this.skillsExtractor.extract(skillsPath);

        // 4. 获取极简目录树（默认最多 5 层，防止撑爆 Token）
        const directoryTree = this.treeBuilder.getTreeString();

        return {
            framework,
            readme: rules.readme,
            claude: rules.claudeMd, // 优雅对齐属性名
            directoryTree,
            skills
        };
    }
}