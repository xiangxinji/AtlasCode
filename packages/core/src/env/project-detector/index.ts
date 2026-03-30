import { SupportedFramework } from '@/types/env';
import * as fs from 'fs';
import * as path from 'path';

// 1. 只保留你指定的 4 种类型 + 兜底


export class ProjectDetector {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = path.resolve(projectPath);
    }

    /**
     * 🌟 核心方法：只通过最强特征判断框架
     */
    public detect(): SupportedFramework | 'unknown' {
        const packageJsonPath = path.join(this.projectPath, 'package.json');

        // ----------------------------------------
        // 🔍 场景 1：如果存在 package.json (Node.js 生态)
        // ----------------------------------------
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

                if (allDeps['vue']) {
                    return 'vue';
                }


            } catch (error) {
                console.error('❌ 解析 package.json 失败:', error);
            }
        }

        // ----------------------------------------
        // 🔍 场景 2：如果没有 package.json，或者没匹配到，看是不是 Java
        // ----------------------------------------
        // Java 项目必然有 pom.xml (Maven) 或者 build.gradle (Gradle)
        const hasMaven = fs.existsSync(path.join(this.projectPath, 'pom.xml'));
        const hasGradle = fs.existsSync(path.join(this.projectPath, 'build.gradle'));
        const hasSrcMainJava = fs.existsSync(path.join(this.projectPath, 'src', 'main', 'java'));

        if (hasMaven || hasGradle || hasSrcMainJava) {
            return 'java';
        }

        return 'unknown';
    }
}