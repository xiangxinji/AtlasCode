import { DependencyAnalyzer,  } from "../core/src/repo-map";
import { ProjectDetector } from "../core/src/env/project-detector";

export interface BuilderOptions {
    projectPath: string;
}

export interface BuildContext {
    projectPath: string;
};


export class Builder {
    private context: BuildContext;

    constructor({ projectPath }: BuilderOptions) {
        this.context = { projectPath };
    }

    async build() {
        const detector = new ProjectDetector(this.context.projectPath);
        const framework = detector.detect();

        if (framework === 'unknown') {
            throw new Error('项目未检测到框架类型');
        }

        const analyzer = new DependencyAnalyzer({
            scanOptions: {
                framework: framework,
                verbose: true
            },
            projectDir: this.context.projectPath
        });

        await analyzer.initialize();
        analyzer.scanDirectory();


        console.log(analyzer.result);
        

    }

}