import { DependencyAnalyzer } from "../core/src/repo-map";
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

        const analyzer = new DependencyAnalyzer({
            scanOptions: {
                framework: framework,  
                verbose: true
            }
        });
        await analyzer.initialize();
        const result = analyzer.scanDirectory(this.context.projectPath);
        console.log(result);
    }

}