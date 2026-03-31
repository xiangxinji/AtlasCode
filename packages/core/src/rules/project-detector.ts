import { SupportedFramework } from '@/types/env';
import { ProjectUtils } from '@/utils/project-utils';
import * as path from 'path';

export class ProjectDetector {
    private projectPath: string;

    constructor(projectPath: string) {
        // 🌟 使用工具：路径归一化
        this.projectPath = ProjectUtils.normalizePath(path.resolve(projectPath));
    }

    public detect(): SupportedFramework | 'unknown' {
        const packageJsonPath = path.join(this.projectPath, 'package.json');

        // 🔍 场景 1：Node.js 生态
        // 🌟 使用工具：安全读取 JSON
        const pkg = ProjectUtils.readJsonSafe(packageJsonPath);
        if (pkg) {
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (allDeps['vue']) {
                return 'vue';
            }
        }

        // 🔍 场景 2：Java 生态
        // 🌟 使用工具：多特征文件检查
        const isJavaBuild = ProjectUtils.hasAnyFile(this.projectPath, ['pom.xml', 'build.gradle']);
        const hasJavaSrc = ProjectUtils.isDirectory(path.join(this.projectPath, 'src', 'main', 'java'));

        if (isJavaBuild || hasJavaSrc) {
            return 'java';
        }

        return 'unknown';
    }
}